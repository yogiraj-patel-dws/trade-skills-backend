const walletService = require('../services/walletService');
const ApiResponse = require('../utils/ApiResponse');

class WalletController {
  async getWallet(req, res) {
    try {
      const wallet = await walletService.getWallet(req.user.id);
      res.status(200).json(ApiResponse.success(wallet, 'Wallet retrieved successfully', 200));
    } catch (error) {
      res.status(500).json(ApiResponse.error('Failed to get wallet', 500));
    }
  }

  async getTransactions(req, res) {
    try {
      const { type, limit, offset } = req.query;
      const transactions = await walletService.getTransactions(req.user.id, { type, limit, offset });
      
      res.status(200).json(ApiResponse.success(transactions, 'Transactions retrieved successfully', 200));
    } catch (error) {
      res.status(500).json(ApiResponse.error('Failed to get transactions', 500));
    }
  }

  async lockCredits(req, res) {
    try {
      const { amount, sessionId, reason } = req.body;
      const result = await walletService.lockCredits(req.user.id, amount, sessionId, reason);
      
      res.status(200).json(ApiResponse.success(result, 'Credits locked successfully', 200));
    } catch (error) {
      res.status(400).json(ApiResponse.error(error.message, 400));
    }
  }

  async releaseCredits(req, res) {
    try {
      const { sessionId, toHost = false } = req.body;
      const result = await walletService.releaseCredits(req.user.id, sessionId, toHost);
      
      res.status(200).json(ApiResponse.success(result, 'Credits released successfully', 200));
    } catch (error) {
      res.status(400).json(ApiResponse.error(error.message, 400));
    }
  }

  async getLockedCredits(req, res) {
    try {
      const lockedCredits = await walletService.getLockedCredits(req.user.id);
      res.status(200).json(ApiResponse.success(lockedCredits, 'Locked credits retrieved', 200));
    } catch (error) {
      res.status(500).json(ApiResponse.error('Failed to get locked credits', 500));
    }
  }
}

module.exports = new WalletController();