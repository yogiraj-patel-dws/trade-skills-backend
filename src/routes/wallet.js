const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { authenticate } = require('../middleware/auth');

// All wallet routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/wallet:
 *   get:
 *     summary: Get user wallet
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         availableCredits:
 *                           type: integer
 *                         lockedCredits:
 *                           type: integer
 *                         totalEarned:
 *                           type: integer
 *                         totalSpent:
 *                           type: integer
 */
router.get('/', walletController.getWallet);

/**
 * @swagger
 * /api/wallet/transactions:
 *   get:
 *     summary: Get wallet transactions
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [CREDIT_PURCHASE, SESSION_PAYMENT, SESSION_EARNING, REFUND, ADMIN_ADJUSTMENT]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 */
router.get('/transactions', walletController.getTransactions);

/**
 * @swagger
 * /api/wallet/locked-credits:
 *   get:
 *     summary: Get locked credits
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Locked credits retrieved
 */
router.get('/locked-credits', walletController.getLockedCredits);

/**
 * @swagger
 * /api/wallet/lock-credits:
 *   post:
 *     summary: Lock credits for session
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - sessionId
 *             properties:
 *               amount:
 *                 type: integer
 *                 minimum: 1
 *               sessionId:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Credits locked successfully
 *       400:
 *         description: Insufficient credits or invalid request
 */
router.post('/lock-credits', walletController.lockCredits);

/**
 * @swagger
 * /api/wallet/release-credits:
 *   post:
 *     summary: Release locked credits
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *             properties:
 *               sessionId:
 *                 type: string
 *               toHost:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Credits released successfully
 *       400:
 *         description: No active locks found or invalid request
 */
router.post('/release-credits', walletController.releaseCredits);

module.exports = router;
