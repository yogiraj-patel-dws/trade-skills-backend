const paymentService = require('../services/paymentService');
const ApiResponse = require('../utils/ApiResponse');

class PaymentController {
  async getPackages(req, res) {
    try {
      const packages = await paymentService.getPaymentPackages();
      res.status(200).json(ApiResponse.success(packages, 'Payment packages retrieved', 200));
    } catch (error) {
      res.status(500).json(ApiResponse.error('Failed to get payment packages', 500));
    }
  }

  async createOrder(req, res) {
    try {
      const { packageId } = req.body;
      const result = await paymentService.createPaymentOrder(req.user.id, packageId);
      
      res.status(201).json(ApiResponse.success(result, 'Payment order created', 201));
    } catch (error) {
      res.status(400).json(ApiResponse.error(error.message, 400));
    }
  }

  async verifyPayment(req, res) {
    try {
      const payment = await paymentService.verifyPayment(req.body);
      res.status(200).json(ApiResponse.success(payment, 'Payment verified successfully', 200));
    } catch (error) {
      res.status(400).json(ApiResponse.error(error.message, 400));
    }
  }

  async handleWebhook(req, res) {
    try {
      const signature = req.headers['x-razorpay-signature'];
      const result = await paymentService.handleWebhook(signature, JSON.stringify(req.body));
      
      res.status(200).json(ApiResponse.success(result, 'Webhook processed', 200));
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(400).json(ApiResponse.error('Webhook processing failed', 400));
    }
  }

  async getPaymentHistory(req, res) {
    try {
      const { status, limit, offset } = req.query;
      const payments = await paymentService.getPaymentHistory(req.user.id, { status, limit, offset });
      
      res.status(200).json(ApiResponse.success(payments, 'Payment history retrieved', 200));
    } catch (error) {
      res.status(500).json(ApiResponse.error('Failed to get payment history', 500));
    }
  }
}

module.exports = new PaymentController();