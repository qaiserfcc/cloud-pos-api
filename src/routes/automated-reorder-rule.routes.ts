import { Router } from 'express';
import AutomatedReorderRuleController, {
  createReorderRuleValidators,
  updateReorderRuleValidators,
  getReorderRuleValidators,
  deleteReorderRuleValidators,
  checkReorderRulesValidators,
} from '../controllers/automated-reorder-rule.controller';
import { authenticateToken, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Create a new automated reorder rule
router.post(
  '/',
  requirePermission('inventory.reorder_rules.create'),
  createReorderRuleValidators,
  AutomatedReorderRuleController.createReorderRule
);

// Get all automated reorder rules for the tenant
router.get(
  '/',
  requirePermission('inventory.reorder_rules.read'),
  AutomatedReorderRuleController.getReorderRules
);

// Get a specific automated reorder rule
router.get(
  '/:ruleId',
  requirePermission('inventory.reorder_rules.read'),
  getReorderRuleValidators,
  AutomatedReorderRuleController.getReorderRuleById
);

// Update an automated reorder rule
router.put(
  '/:ruleId',
  requirePermission('inventory.reorder_rules.update'),
  updateReorderRuleValidators,
  AutomatedReorderRuleController.updateReorderRule
);

// Delete an automated reorder rule
router.delete(
  '/:ruleId',
  requirePermission('inventory.reorder_rules.delete'),
  deleteReorderRuleValidators,
  AutomatedReorderRuleController.deleteReorderRule
);

// Manually trigger check and execution of reorder rules
router.post(
  '/check',
  requirePermission('inventory.reorder_rules.execute'),
  checkReorderRulesValidators,
  AutomatedReorderRuleController.checkAndExecuteReorderRules
);

// Get reorder rule statistics
router.get(
  '/stats/overview',
  requirePermission('inventory.reorder_rules.read'),
  AutomatedReorderRuleController.getReorderRuleStats
);

export default router;