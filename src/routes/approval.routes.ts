import { Router } from 'express';
import { body, param, query } from 'express-validator';
import ApprovalController from '../controllers/approval.controller';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware';

const router = Router();
const approvalController = new ApprovalController();

// Apply common middlewares
router.use(authenticateToken);

/**
 * @swagger
 * /api/v1/approvals/rules:
 *   post:
 *     summary: Create approval rule
 *     tags: [Approvals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - objectType
 *               - conditions
 *             properties:
 *               name:
 *                 type: string
 *               objectType:
 *                 type: string
 *                 enum: [inventory_transfer, sale, purchase, adjustment]
 *               conditions:
 *                 type: object
 *               approvalLevels:
 *                 type: array
 *                 items:
 *                   type: object
 *               isActive:
 *                 type: boolean
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Approval rule created successfully
 */
router.post(
  '/rules',
  requirePermission('audit:manage'),
  [
    body('name').notEmpty().withMessage('Rule name is required'),
    body('objectType').isIn(['inventory_transfer', 'sale', 'purchase', 'adjustment']).withMessage('Invalid object type'),
    body('conditions').isObject().withMessage('Conditions must be an object'),
  ],
  approvalController.createApprovalRule
);

/**
 * @swagger
 * /api/v1/approvals/rules:
 *   get:
 *     summary: Get approval rules
 *     tags: [Approvals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: objectType
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of approval rules
 */
router.get(
  '/rules',
  requirePermission('audit:view'),
  approvalController.getApprovalRules
);

/**
 * @swagger
 * /api/v1/approvals/rules/{ruleId}:
 *   put:
 *     summary: Update approval rule
 *     tags: [Approvals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ruleId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               conditions:
 *                 type: object
 *               approvalLevels:
 *                 type: array
 *               isActive:
 *                 type: boolean
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Approval rule updated successfully
 */
router.put(
  '/rules/:ruleId',
  requirePermission('audit:manage'),
  [
    param('ruleId').isUUID().withMessage('Invalid rule ID'),
  ],
  approvalController.updateApprovalRule
);

/**
 * @swagger
 * /api/v1/approvals/rules/{ruleId}:
 *   delete:
 *     summary: Delete approval rule
 *     tags: [Approvals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ruleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Approval rule deleted successfully
 */
router.delete(
  '/rules/:ruleId',
  requirePermission('audit:manage'),
  [
    param('ruleId').isUUID().withMessage('Invalid rule ID'),
  ],
  approvalController.deleteApprovalRule
);

/**
 * @swagger
 * /api/v1/approvals/requests:
 *   post:
 *     summary: Create approval request
 *     tags: [Approvals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - objectType
 *               - objectId
 *               - title
 *             properties:
 *               objectType:
 *                 type: string
 *                 enum: [inventory_transfer, sale, purchase, adjustment]
 *               objectId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *               approvalData:
 *                 type: object
 *     responses:
 *       201:
 *         description: Approval request created successfully
 */
router.post(
  '/requests',
  requirePermission('audit:create'),
  [
    body('objectType').isIn(['inventory_transfer', 'sale', 'purchase', 'adjustment']).withMessage('Invalid object type'),
    body('objectId').notEmpty().withMessage('Object ID is required'),
    body('title').notEmpty().withMessage('Title is required'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  ],
  approvalController.createApprovalRequest
);

/**
 * @swagger
 * /api/v1/approvals/requests/pending:
 *   get:
 *     summary: Get pending approvals for current user
 *     tags: [Approvals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending approval requests
 */
router.get(
  '/requests/pending',
  requirePermission('audit:view'),
  approvalController.getPendingApprovals
);

/**
 * @swagger
 * /api/v1/approvals/requests/{requestId}:
 *   get:
 *     summary: Get approval request by ID
 *     tags: [Approvals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Approval request details
 */
router.get(
  '/requests/:requestId',
  requirePermission('audit:view'),
  [
    param('requestId').isUUID().withMessage('Invalid request ID'),
  ],
  approvalController.getApprovalRequest
);

/**
 * @swagger
 * /api/v1/approvals/requests/{requestId}/process:
 *   post:
 *     summary: Process approval decision
 *     tags: [Approvals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - decision
 *             properties:
 *               decision:
 *                 type: string
 *                 enum: [approved, rejected]
 *               comments:
 *                 type: string
 *     responses:
 *       200:
 *         description: Approval processed successfully
 */
router.post(
  '/requests/:requestId/process',
  requirePermission('audit:approve'),
  [
    param('requestId').isUUID().withMessage('Invalid request ID'),
    body('decision').isIn(['approved', 'rejected']).withMessage('Invalid decision'),
    body('comments').optional().isString().withMessage('Comments must be a string'),
  ],
  approvalController.processApproval
);

/**
 * @swagger
 * /api/v1/approvals/requests/{requestId}/cancel:
 *   post:
 *     summary: Cancel approval request
 *     tags: [Approvals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Approval request cancelled successfully
 */
router.post(
  '/requests/:requestId/cancel',
  requirePermission('audit:manage'),
  [
    param('requestId').isUUID().withMessage('Invalid request ID'),
    body('reason').notEmpty().withMessage('Cancellation reason is required'),
  ],
  approvalController.cancelApprovalRequest
);

/**
 * @swagger
 * /api/v1/approvals/check-required:
 *   post:
 *     summary: Check if approval is required
 *     tags: [Approvals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - objectType
 *               - approvalData
 *             properties:
 *               objectType:
 *                 type: string
 *                 enum: [inventory_transfer, 'sale', 'purchase', 'adjustment']
 *               approvalData:
 *                 type: object
 *     responses:
 *       200:
 *         description: Approval requirement check result
 */
router.post(
  '/check-required',
  requirePermission('audit:view'),
  [
    body('objectType').isIn(['inventory_transfer', 'sale', 'purchase', 'adjustment']).withMessage('Invalid object type'),
    body('approvalData').isObject().withMessage('Approval data must be an object'),
  ],
  approvalController.checkApprovalRequired
);

/**
 * @swagger
 * /api/v1/approvals/statistics:
 *   get:
 *     summary: Get approval statistics
 *     tags: [Approvals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Approval statistics
 */
router.get(
  '/statistics',
  requirePermission('audit:view'),
  approvalController.getApprovalStatistics
);

export default router;