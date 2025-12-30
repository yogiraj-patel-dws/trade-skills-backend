const express = require('express');
const router = express.Router();
const { ReportController } = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

// All report routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/reports:
 *   post:
 *     summary: Submit a report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReportRequest'
 *     responses:
 *       201:
 *         description: Report submitted successfully
 *       400:
 *         description: Validation error
 */
router.post('/', validate(schemas.createReport), ReportController.createReport);

/**
 * @swagger
 * /api/reports/my:
 *   get:
 *     summary: Get user's reports
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, INVESTIGATING, RESOLVED, DISMISSED]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reports retrieved
 */
router.get('/my', ReportController.getUserReports);

/**
 * @swagger
 * /api/reports/{id}:
 *   get:
 *     summary: Get report by ID
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Report retrieved
 *       404:
 *         description: Report not found
 */
router.get('/:id', ReportController.getReportById);

module.exports = router;
