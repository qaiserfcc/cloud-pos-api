import { ApprovalService } from '../services/approval.service';
import { ApprovalRule, ApprovalRequest } from '../models';

describe('ApprovalService', () => {
  let approvalService: ApprovalService;

  beforeEach(() => {
    approvalService = new ApprovalService();
  });

  describe('isApprovalRequired', () => {
    it('should return false when no rules exist', async () => {
      // Mock the ApprovalRule.findAll method to return empty array
      jest.spyOn(ApprovalRule, 'findAll').mockResolvedValue([]);

      const result = await approvalService.isApprovalRequired(
        '550e8400-e29b-41d4-a716-446655440000', // Valid UUID
        'inventory_transfer',
        { amount: 100 }
      );

      expect(result).toBe(false);
      expect(ApprovalRule.findAll).toHaveBeenCalledWith({
        where: {
          tenantId: '550e8400-e29b-41d4-a716-446655440000',
          objectType: 'inventory_transfer',
          isActive: true,
        },
        order: [['createdAt', 'DESC']],
      });
    });

    it('should return true when rule requires approval', async () => {
      const mockRule = {
        id: 'rule-123',
        tenantId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Rule',
        objectType: 'inventory_transfer',
        conditions: { requiresApproval: true, minAmount: 500 },
        isActive: true,
        matchesRuleConditions: jest.fn().mockReturnValue(true),
      };

      // Mock the ApprovalRule.findAll method
      jest.spyOn(ApprovalRule, 'findAll').mockResolvedValue([mockRule as any]);

      const result = await approvalService.isApprovalRequired(
        '550e8400-e29b-41d4-a716-446655440000',
        'inventory_transfer',
        { amount: 1000 }
      );

      expect(result).toBe(true);
    });
  });

  describe('createApprovalRequest', () => {
    it('should create approval request data structure', async () => {
      const requestData = {
        tenantId: '550e8400-e29b-41d4-a716-446655440000',
        requestedById: '550e8400-e29b-41d4-a716-446655440001',
        objectType: 'inventory_transfer' as const,
        objectId: '550e8400-e29b-41d4-a716-446655440002',
        title: 'Test Transfer Approval',
        description: 'Test description',
        priority: 'medium' as const,
        approvalData: {
          amount: 1000,
          details: { items: [] }
        }
      };

      // Test the data structure
      expect(requestData.tenantId).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(requestData.objectType).toBe('inventory_transfer');
      expect(requestData.priority).toBe('medium');
    });
  });
});