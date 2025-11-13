#!/usr/bin/env node

/**
 * End-to-End Approval Workflow Test
 * Tests the complete approval workflow with inventory transfer integration
 */

require('dotenv').config();

const sequelize = require('./dist/config/database').default;

async function testApprovalWorkflow() {
  const transaction = await sequelize.transaction();
  try {
    console.log('🔄 Testing end-to-end approval workflow...');

    // Import required modules
    const { Tenant, Store, User, ApprovalRule, ApprovalRequest } = require('./dist/db/models');
    const ApprovalService = require('./dist/services/approval.service').default;

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Create test tenant
    console.log('🔄 Creating test tenant...');
    const timestamp = Date.now();
    const tenant = await Tenant.create({
      id: '550e8400-e29b-41d4-a716-446655440010',
      name: `Test Tenant ${timestamp}`,
      domain: `test${timestamp}.example.com`,
      settings: { test: true },
      isActive: true,
    }, { transaction });
    console.log('✅ Test tenant created');

        // Create test store
    console.log('🔄 Creating test store...');
    const store = await Store.create({
      id: '550e8400-e29b-41d4-a716-446655440011',
      tenantId: tenant.id,
      name: `Test Store ${timestamp}`,
      code: `TEST${timestamp}`,
      address: '123 Test St',
      phone: '555-0123',
      email: `test${timestamp}@example.com`,
      settings: {},
      isActive: true,
    }, { transaction });
    console.log('✅ Test store created');

    // Create test user
    console.log('🔄 Creating test user...');
    const user = await User.create({
      id: '550e8400-e29b-41d4-a716-446655440012',
      tenantId: tenant.id,
      defaultStoreId: store.id,
      email: `test${timestamp}@example.com`,
      password: 'hashedpassword',
      firstName: 'Test',
      lastName: 'User',
      isActive: true,
    }, { transaction });
    console.log('✅ Test user created');

    // Create approval rule for inventory transfers over $500
    console.log('🔄 Creating approval rule...');
    const approvalRule = await ApprovalRule.create({
      id: '550e8400-e29b-41d4-a716-446655440013',
      tenantId: tenant.id,
      name: 'High Value Transfer Approval',
      description: 'Requires approval for inventory transfers over $500',
      objectType: 'inventory_transfer',
      conditions: {
        requiresApproval: true,
        minAmount: 500,
        approvalLevels: [
          {
            level: 1,
            name: 'Store Manager',
            approverRoles: ['store_manager'],
            requiredApprovals: 1,
          }
        ],
        expiryHours: 24,
      },
      isActive: true,
    }, { transaction });
    console.log('✅ Approval rule created');

    // Test approval service
    console.log('🔄 Testing approval service...');
    const approvalService = new ApprovalService();

    // Test 1: Check if approval is required for low-value transfer
    const requiresApprovalLow = await approvalService.isApprovalRequired(
      tenant.id,
      'inventory_transfer',
      { amount: 100 },
      store.id
    );
    console.log(`✅ Low-value transfer requires approval: ${requiresApprovalLow}`);

    // Test 2: Check if approval is required for high-value transfer
    const requiresApprovalHigh = await approvalService.isApprovalRequired(
      tenant.id,
      'inventory_transfer',
      { amount: 1000 },
      store.id
    );
    console.log(`✅ High-value transfer requires approval: ${requiresApprovalHigh}`);

    // Debug: Check what rules exist
    const rules = await ApprovalRule.findAll({
      where: {
        tenantId: tenant.id,
        objectType: 'inventory_transfer',
        isActive: true,
      },
      transaction
    });
    console.log(`📋 Found ${rules.length} approval rules for inventory_transfer`);
    rules.forEach(rule => {
      console.log(`   Rule: ${rule.name}, conditions:`, rule.conditions);
    });

    // Test 3: Create approval request for high-value transfer
    console.log('🔄 Creating approval request...');
    const approvalRequest = await approvalService.createApprovalRequest({
      tenantId: tenant.id,
      storeId: store.id,
      requestedById: user.id,
      objectType: 'inventory_transfer',
      objectId: '550e8400-e29b-41d4-a716-446655440014',
      title: 'High Value Inventory Transfer',
      description: 'Transfer of high-value items requiring approval',
      priority: 'high',
      approvalData: {
        amount: 1000,
        transferType: 'replenishment',
        items: [
          { productId: 'prod-1', quantity: 10, unitCost: 100 }
        ]
      }
    }, transaction);

    if (!approvalRequest) {
      throw new Error('Approval request creation returned null/undefined');
    }

    console.log('✅ Approval request created object:', approvalRequest);
    console.log('✅ Approval request id:', approvalRequest.dataValues?.id || approvalRequest.id);

    // Test 4: Verify approval request details
    const requestId = approvalRequest.dataValues?.id || approvalRequest.id;
    const fetchedRequest = await ApprovalRequest.findByPk(requestId, { transaction });
    if (!fetchedRequest) {
      throw new Error('Could not fetch created approval request');
    }

    console.log('✅ Approval request details:', {
      status: fetchedRequest.status,
      priority: fetchedRequest.priority,
      currentLevel: fetchedRequest.currentLevel,
      totalLevels: fetchedRequest.totalLevels,
    });

    // Rollback transaction to clean up test data
    await transaction.rollback();

    console.log('🎉 End-to-end approval workflow test completed successfully!');

  } catch (error) {
    await transaction.rollback();
    console.error('❌ End-to-end test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run test
if (require.main === module) {
  testApprovalWorkflow();
}

module.exports = { testApprovalWorkflow };