const prisma = require('../config/database');

class WalletService {
  async getWallet(userId) {
    let wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    // Create wallet if doesn't exist
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId },
        include: {
          transactions: true
        }
      });
    }

    return wallet;
  }

  async getTransactions(userId, filters = {}) {
    const { type, limit = 20, offset = 0 } = filters;
    
    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const where = { walletId: wallet.id };
    if (type) where.type = type;

    return await prisma.transaction.findMany({
      where,
      include: {
        session: {
          select: {
            id: true,
            title: true
          }
        },
        payment: {
          select: {
            id: true,
            amount: true,
            gateway: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });
  }

  async addCredits(userId, amount, description = 'Credits added', paymentId = null) {
    return await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId }
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Update wallet balance
      const updatedWallet = await tx.wallet.update({
        where: { userId },
        data: {
          availableCredits: { increment: amount },
          totalEarned: { increment: amount }
        }
      });

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          walletId: wallet.id,
          paymentId,
          type: 'CREDIT_PURCHASE',
          amount,
          description,
          status: 'COMPLETED'
        }
      });

      return { wallet: updatedWallet, transaction };
    });
  }

  async lockCredits(userId, amount, sessionId, reason = 'Session booking') {
    return await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId }
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      if (wallet.availableCredits < amount) {
        throw new Error('Insufficient credits');
      }

      // Convert sessionId to string if it's a number
      const sessionIdStr = String(sessionId);

      // Update wallet
      const updatedWallet = await tx.wallet.update({
        where: { userId },
        data: {
          availableCredits: { decrement: amount },
          lockedCredits: { increment: amount }
        }
      });

      // Create credit lock
      const creditLock = await tx.creditLock.create({
        data: {
          walletId: wallet.id,
          sessionId: sessionIdStr,
          amount,
          reason
        }
      });

      return { wallet: updatedWallet, creditLock };
    });
  }

  async releaseCredits(userId, sessionId, toHost = false) {
    return await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId }
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Find active credit locks for this session
      const creditLocks = await tx.creditLock.findMany({
        where: {
          walletId: wallet.id,
          sessionId,
          isReleased: false
        }
      });

      if (creditLocks.length === 0) {
        throw new Error('No active credit locks found for this session');
      }

      const totalAmount = creditLocks.reduce((sum, lock) => sum + lock.amount, 0);

      if (toHost) {
        // Credits go to host (session completed)
        await tx.wallet.update({
          where: { userId },
          data: {
            lockedCredits: { decrement: totalAmount },
            totalSpent: { increment: totalAmount }
          }
        });
      } else {
        // Credits return to user (session cancelled/refunded)
        await tx.wallet.update({
          where: { userId },
          data: {
            availableCredits: { increment: totalAmount },
            lockedCredits: { decrement: totalAmount }
          }
        });
      }

      // Mark credit locks as released
      await tx.creditLock.updateMany({
        where: {
          walletId: wallet.id,
          sessionId,
          isReleased: false
        },
        data: {
          isReleased: true,
          releasedAt: new Date()
        }
      });

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          walletId: wallet.id,
          sessionId,
          type: toHost ? 'SESSION_PAYMENT' : 'REFUND',
          amount: toHost ? -totalAmount : totalAmount,
          description: toHost ? 'Payment for completed session' : 'Refund for cancelled session',
          status: 'COMPLETED'
        }
      });

      return { transaction, amount: totalAmount };
    });
  }

  async transferCredits(fromUserId, toUserId, amount, sessionId, description) {
    return await prisma.$transaction(async (tx) => {
      // Get both wallets
      const fromWallet = await tx.wallet.findUnique({
        where: { userId: fromUserId }
      });

      const toWallet = await tx.wallet.findUnique({
        where: { userId: toUserId }
      });

      if (!fromWallet || !toWallet) {
        throw new Error('Wallet not found');
      }

      if (fromWallet.lockedCredits < amount) {
        throw new Error('Insufficient locked credits');
      }

      // Update sender wallet
      await tx.wallet.update({
        where: { userId: fromUserId },
        data: {
          lockedCredits: { decrement: amount },
          totalSpent: { increment: amount }
        }
      });

      // Update receiver wallet
      await tx.wallet.update({
        where: { userId: toUserId },
        data: {
          availableCredits: { increment: amount },
          totalEarned: { increment: amount }
        }
      });

      // Create transactions for both users
      const senderTransaction = await tx.transaction.create({
        data: {
          walletId: fromWallet.id,
          sessionId,
          type: 'SESSION_PAYMENT',
          amount: -amount,
          description: `Payment: ${description}`,
          status: 'COMPLETED'
        }
      });

      const receiverTransaction = await tx.transaction.create({
        data: {
          walletId: toWallet.id,
          sessionId,
          type: 'SESSION_EARNING',
          amount,
          description: `Earning: ${description}`,
          status: 'COMPLETED'
        }
      });

      return { senderTransaction, receiverTransaction };
    });
  }

  async getLockedCredits(userId) {
    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    return await prisma.creditLock.findMany({
      where: {
        walletId: wallet.id,
        isReleased: false
      },
      include: {
        wallet: {
          include: {
            user: {
              select: {
                profile: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { lockedAt: 'desc' }
    });
  }
}

module.exports = new WalletService();