import express from 'express';
import { validateRequest, commonSchemas } from '@/middleware/validation';
import { asyncHandler } from '@/middleware/errorHandler';
import { AuthenticatedRequest } from '@/middleware/auth';
import { query } from '@/database/connection';
import { hashPin } from '@/utils/helpers';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const updateProfileSchema = {
  body: Joi.object({
    firstname: Joi.string().min(2).max(50).optional(),
    middlename: Joi.string().min(2).max(50).optional(),
    lastname: Joi.string().min(2).max(50).optional(),
  }),
};

const changePinSchema = {
  body: Joi.object({
    currentPin: commonSchemas.pin,
    newPin: commonSchemas.pin,
  }),
};

// GET /api/users/profile - Get current user profile
router.get('/profile', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;

  const result = await query(
    `SELECT 
      id, firstname, middlename, lastname, mobile, 
      is_verified, is_active, last_login, created_at, updated_at
     FROM users 
     WHERE id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'User not found',
    });
  }

  const user = result.rows[0];

  res.json({
    success: true,
    data: {
      id: user.id,
      firstname: user.firstname,
      middlename: user.middlename,
      lastname: user.lastname,
      mobile: user.mobile,
      isVerified: user.is_verified,
      isActive: user.is_active,
      lastLogin: user.last_login,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    },
  });
}));

// PUT /api/users/profile - Update user profile
router.put('/profile', validateRequest(updateProfileSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { firstname, middlename, lastname } = req.body;

  // Build dynamic update query
  const updateFields = [];
  const values = [];
  let paramCount = 0;

  if (firstname !== undefined) {
    paramCount++;
    updateFields.push(`firstname = $${paramCount}`);
    values.push(firstname);
  }

  if (middlename !== undefined) {
    paramCount++;
    updateFields.push(`middlename = $${paramCount}`);
    values.push(middlename);
  }

  if (lastname !== undefined) {
    paramCount++;
    updateFields.push(`lastname = $${paramCount}`);
    values.push(lastname);
  }

  if (updateFields.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No fields to update',
    });
  }

  paramCount++;
  values.push(userId);

  const result = await query(
    `UPDATE users 
     SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramCount}
     RETURNING id, firstname, middlename, lastname, mobile, updated_at`,
    values
  );

  const updatedUser = result.rows[0];

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      id: updatedUser.id,
      firstname: updatedUser.firstname,
      middlename: updatedUser.middlename,
      lastname: updatedUser.lastname,
      mobile: updatedUser.mobile,
      updatedAt: updatedUser.updated_at,
    },
  });
}));

// PUT /api/users/change-pin - Change user PIN
router.put('/change-pin', validateRequest(changePinSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { currentPin, newPin } = req.body;

  // Get current PIN hash
  const userResult = await query(
    'SELECT pin FROM users WHERE id = $1',
    [userId]
  );

  if (userResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'User not found',
    });
  }

  const { pin: currentPinHash } = userResult.rows[0];

  // Verify current PIN
  const bcrypt = require('bcryptjs');
  const isValidPin = await bcrypt.compare(currentPin, currentPinHash);
  
  if (!isValidPin) {
    return res.status(400).json({
      success: false,
      error: 'Current PIN is incorrect',
    });
  }

  // Hash new PIN
  const newPinHash = await hashPin(newPin);

  // Update PIN
  await query(
    'UPDATE users SET pin = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [newPinHash, userId]
  );

  res.json({
    success: true,
    message: 'PIN changed successfully',
  });
}));

// GET /api/users/activity - Get user activity summary
router.get('/activity', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;

  // Get user activity statistics
  const activityResult = await query(
    `SELECT 
      (SELECT COUNT(*) FROM sales_orders WHERE created_by = $1) as sales_created,
      (SELECT COUNT(*) FROM purchase_orders WHERE created_by = $1) as purchases_created,
      (SELECT COUNT(*) FROM items WHERE created_by = $1) as items_created,
      (SELECT COUNT(*) FROM inventory_transactions WHERE created_by = $1) as transactions_created`,
    [userId]
  );

  const activity = activityResult.rows[0];

  // Get recent activities
  const recentActivitiesResult = await query(
    `(SELECT 
      'sale' as activity_type,
      so.order_number as reference,
      so.total_amount as amount,
      so.created_at
     FROM sales_orders so
     WHERE so.created_by = $1
     ORDER BY so.created_at DESC
     LIMIT 5)
     
     UNION ALL
     
     (SELECT 
      'purchase' as activity_type,
      po.order_number as reference,
      po.total_amount as amount,
      po.created_at
     FROM purchase_orders po
     WHERE po.created_by = $1
     ORDER BY po.created_at DESC
     LIMIT 5)
     
     ORDER BY created_at DESC
     LIMIT 10`,
    [userId]
  );

  res.json({
    success: true,
    data: {
      summary: {
        salesCreated: parseInt(activity.sales_created),
        purchasesCreated: parseInt(activity.purchases_created),
        itemsCreated: parseInt(activity.items_created),
        transactionsCreated: parseInt(activity.transactions_created),
      },
      recentActivities: recentActivitiesResult.rows.map(row => ({
        type: row.activity_type,
        reference: row.reference,
        amount: parseFloat(row.amount),
        createdAt: row.created_at,
      })),
    },
  });
}));

export default router;