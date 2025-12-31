const Razorpay = require('razorpay');
const crypto = require('crypto');
const prisma = require('../config/database');
const walletService = require('./walletService');

class PaymentService {
  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }

  async getPaymentPackages() {
    return await prisma.paymentPackage.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' }
    });
  }

  async createPaymentOrder(userId, packageId) {
    // Convert packageId to string if it's a number
    const packageIdStr = String(packageId);
    
    const paymentPackage = await prisma.paymentPackage.findFirst({
      where: { 
        id: packageIdStr,
        isActive: true 
      }
    });

    if (!paymentPackage) {
      throw new Error('Payment package not found');
    }

    // Create Razorpay order
    const orderOptions = {
      amount: Math.round(paymentPackage.price * 100), // Convert to paise
      currency: paymentPackage.currency,
      receipt: `order_${Date.now()}`,
      notes: {
        userId,
        packageId,
        credits: paymentPackage.credits
      }
    };

    const razorpayOrder = await this.razorpay.orders.create(orderOptions);

    // Save payment record
    const payment = await prisma.payment.create({
      data: {
        userId,
        packageId: packageIdStr,
        amount: paymentPackage.price,
        currency: paymentPackage.currency,
        gateway: 'RAZORPAY',
        gatewayOrderId: razorpayOrder.id,
        status: 'PENDING',
        creditsAwarded: paymentPackage.credits,
        updatedAt: BigInt(Date.now())
      }
    });

    return {
      payment,
      razorpayOrder,
      package: paymentPackage
    };
  }

  async verifyPayment(paymentData) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      throw new Error('Invalid payment signature');
    }

    // Find payment record
    const payment = await prisma.payment.findFirst({
      where: {
        gatewayOrderId: razorpay_order_id,
        status: 'PENDING'
      },
      include: {
        package: true
      }
    });

    if (!payment) {
      throw new Error('Payment record not found');
    }

    return await prisma.$transaction(async (tx) => {
      // Update payment status
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          gatewayPaymentId: razorpay_payment_id,
          status: 'COMPLETED'
        }
      });

      // Add credits to user wallet
      await walletService.addCredits(
        payment.userId,
        payment.creditsAwarded,
        `Credit purchase - ${payment.package.name}`,
        payment.id
      );

      return updatedPayment;
    });
  }

  async handleWebhook(signature, payload) {
    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    if (expectedSignature !== signature) {
      throw new Error('Invalid webhook signature');
    }

    const event = JSON.parse(payload);

    if (event.event === 'payment.captured') {
      const paymentEntity = event.payload.payment.entity;
      
      // Find and update payment
      const payment = await prisma.payment.findFirst({
        where: {
          gatewayOrderId: paymentEntity.order_id,
          status: 'PENDING'
        },
        include: {
          package: true
        }
      });

      if (payment) {
        await prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              gatewayPaymentId: paymentEntity.id,
              status: 'COMPLETED'
            }
          });

          await walletService.addCredits(
            payment.userId,
            payment.creditsAwarded,
            `Credit purchase - ${payment.package.name}`,
            payment.id
          );
        });
      }
    } else if (event.event === 'payment.failed') {
      const paymentEntity = event.payload.payment.entity;
      
      await prisma.payment.updateMany({
        where: {
          gatewayOrderId: paymentEntity.order_id,
          status: 'PENDING'
        },
        data: {
          status: 'FAILED',
          failureReason: paymentEntity.error_description
        }
      });
    }

    return { processed: true };
  }

  async getPaymentHistory(userId, filters = {}) {
    const { status, limit = 20, offset = 0 } = filters;
    
    const where = { userId };
    if (status) where.status = status;

    return await prisma.payment.findMany({
      where,
      include: {
        package: {
          select: {
            name: true,
            credits: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });
  }

  async refundPayment(paymentId, reason) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        package: true,
        transactions: true
      }
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'COMPLETED') {
      throw new Error('Can only refund completed payments');
    }

    // Create refund with Razorpay
    const refund = await this.razorpay.payments.refund(payment.gatewayPaymentId, {
      amount: Math.round(payment.amount * 100),
      notes: {
        reason,
        paymentId
      }
    });

    return await prisma.$transaction(async (tx) => {
      // Update payment status
      await tx.payment.update({
        where: { id: paymentId },
        data: { status: 'REFUNDED' }
      });

      // Deduct credits from wallet
      const wallet = await tx.wallet.findUnique({
        where: { userId: payment.userId }
      });

      if (wallet && wallet.availableCredits >= payment.creditsAwarded) {
        await tx.wallet.update({
          where: { userId: payment.userId },
          data: {
            availableCredits: { decrement: payment.creditsAwarded },
            totalEarned: { decrement: payment.creditsAwarded }
          }
        });

        // Create refund transaction
        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            paymentId,
            type: 'REFUND',
            amount: -payment.creditsAwarded,
            description: `Refund: ${reason}`,
            status: 'COMPLETED'
          }
        });
      }

      return { refund, payment };
    });
  }
}

module.exports = new PaymentService();