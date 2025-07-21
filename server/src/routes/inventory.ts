import express from 'express';
import { validateRequest, commonSchemas } from '@/middleware/validation';
import { asyncHandler } from '@/middleware/errorHandler';
import { AuthenticatedRequest } from '@/middleware/auth';
import { query, transaction } from '@/database/connection';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const stockAdjustmentSchema = {
  body: Joi.object({
    itemId: Joi.string().uuid().required(),
    adjustmentType: Joi.string().valid('increase', 'decrease', 'correction').required(),
    quantity: Joi.number().integer().required(),
    reason: Joi.string().min(1).max(200).required(),
    notes: Joi.string().max(500).optional(),
  }),
};

// GET /api/inventory/transactions - Get inventory transactions
router.get('/transactions', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { page = 1, limit = 10, itemId, transactionType, startDate, endDate } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let whereConditions = ['it.id IS NOT NULL'];
  let queryParams: any[] = [];
  let paramCount = 0;

  if (itemId) {
    paramCount++;
    whereConditions.push(`it.item_id = $${paramCount}`);
    queryParams.push(itemId);
  }

  if (transactionType) {
    paramCount++;
    whereConditions.push(`it.transaction_type = $${paramCount}`);
    queryParams.push(transactionType);
  }

  if (startDate) {
    paramCount++;
    whereConditions.push(`it.created_at >= $${paramCount}`);
    queryParams.push(startDate);
  }

  if (endDate) {
    paramCount++;
    whereConditions.push(`it.created_at <= $${paramCount}`);
    queryParams.push(endDate);
  }

  const whereClause = whereConditions.join(' AND ');

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) as total FROM inventory_transactions it WHERE ${whereClause}`,
    queryParams
  );
  const total = parseInt(countResult.rows[0].total);

  // Get transactions
  paramCount++;
  queryParams.push(Number(limit));
  paramCount++;
  queryParams.push(offset);

  const transactionsResult = await query(
    `SELECT 
      it.id, it.item_id, it.transaction_type, it.reference_id,
      it.quantity_change, it.unit_cost, it.notes, it.created_at,
      i.name as item_name, i.sku, i.unit,
      u.firstname || ' ' || u.lastname as created_by_name
     FROM inventory_transactions it
     LEFT JOIN items i ON it.item_id = i.id
     LEFT JOIN users u ON it.created_by = u.id
     WHERE ${whereClause}
     ORDER BY it.created_at DESC
     LIMIT $${paramCount - 1} OFFSET $${paramCount}`,
    queryParams
  );

  const transactions = transactionsResult.rows.map(row => ({
    id: row.id,
    itemId: row.item_id,
    item: {
      id: row.item_id,
      name: row.item_name,
      sku: row.sku,
      unit: row.unit,
    },
    transactionType: row.transaction_type,
    referenceId: row.reference_id,
    quantityChange: row.quantity_change,
    unitCost: row.unit_cost ? parseFloat(row.unit_cost) : null,
    notes: row.notes,
    createdBy: row.created_by_name,
    createdAt: row.created_at,
  }));

  res.json({
    success: true,
    data: transactions,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
}));

// POST /api/inventory/adjust - Create stock adjustment
router.post('/adjust', validateRequest(stockAdjustmentSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { itemId, adjustmentType, quantity, reason, notes } = req.body;

  await transaction(async (client) => {
    // Get current stock
    const itemResult = await client.query(
      'SELECT current_stock, name FROM items WHERE id = $1 AND is_active = true',
      [itemId]
    );

    if (itemResult.rows.length === 0) {
      throw new Error('Item not found');
    }

    const { current_stock, name } = itemResult.rows[0];
    const quantityBefore = current_stock;

    // Calculate new quantity based on adjustment type
    let quantityAfter;
    let quantityChange;

    switch (adjustmentType) {
      case 'increase':
        quantityAfter = quantityBefore + quantity;
        quantityChange = quantity;
        break;
      case 'decrease':
        if (quantity > quantityBefore) {
          throw new Error('Cannot decrease stock below zero');
        }
        quantityAfter = quantityBefore - quantity;
        quantityChange = -quantity;
        break;
      case 'correction':
        quantityAfter = quantity;
        quantityChange = quantity - quantityBefore;
        break;
      default:
        throw new Error('Invalid adjustment type');
    }

    // Update item stock
    await client.query(
      'UPDATE items SET current_stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [quantityAfter, itemId]
    );

    // Record stock adjustment
    const adjustmentResult = await client.query(
      `INSERT INTO stock_adjustments (
        item_id, adjustment_type, quantity_before, quantity_after,
        quantity_change, reason, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [itemId, adjustmentType, quantityBefore, quantityAfter, quantityChange, reason, notes, req.user!.id]
    );

    // Record inventory transaction
    await client.query(
      `INSERT INTO inventory_transactions (
        item_id, transaction_type, quantity_change, notes, created_by
      ) VALUES ($1, 'adjustment', $2, $3, $4)`,
      [itemId, quantityChange, `${adjustmentType}: ${reason}`, req.user!.id]
    );

    const adjustment = adjustmentResult.rows[0];

    res.status(201).json({
      success: true,
      message: 'Stock adjustment recorded successfully',
      data: {
        id: adjustment.id,
        itemId: adjustment.item_id,
        itemName: name,
        adjustmentType: adjustment.adjustment_type,
        quantityBefore: adjustment.quantity_before,
        quantityAfter: adjustment.quantity_after,
        quantityChange: adjustment.quantity_change,
        reason: adjustment.reason,
        notes: adjustment.notes,
        createdAt: adjustment.created_at,
      },
    });
  });
}));

// GET /api/inventory/adjustments - Get stock adjustments
router.get('/adjustments', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { page = 1, limit = 10, itemId, adjustmentType } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let whereConditions = ['sa.id IS NOT NULL'];
  let queryParams: any[] = [];
  let paramCount = 0;

  if (itemId) {
    paramCount++;
    whereConditions.push(`sa.item_id = $${paramCount}`);
    queryParams.push(itemId);
  }

  if (adjustmentType) {
    paramCount++;
    whereConditions.push(`sa.adjustment_type = $${paramCount}`);
    queryParams.push(adjustmentType);
  }

  const whereClause = whereConditions.join(' AND ');

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) as total FROM stock_adjustments sa WHERE ${whereClause}`,
    queryParams
  );
  const total = parseInt(countResult.rows[0].total);

  // Get adjustments
  paramCount++;
  queryParams.push(Number(limit));
  paramCount++;
  queryParams.push(offset);

  const adjustmentsResult = await query(
    `SELECT 
      sa.id, sa.item_id, sa.adjustment_type, sa.quantity_before,
      sa.quantity_after, sa.quantity_change, sa.reason, sa.notes,
      sa.created_at,
      i.name as item_name, i.sku, i.unit,
      u.firstname || ' ' || u.lastname as created_by_name
     FROM stock_adjustments sa
     LEFT JOIN items i ON sa.item_id = i.id
     LEFT JOIN users u ON sa.created_by = u.id
     WHERE ${whereClause}
     ORDER BY sa.created_at DESC
     LIMIT $${paramCount - 1} OFFSET $${paramCount}`,
    queryParams
  );

  const adjustments = adjustmentsResult.rows.map(row => ({
    id: row.id,
    itemId: row.item_id,
    item: {
      id: row.item_id,
      name: row.item_name,
      sku: row.sku,
      unit: row.unit,
    },
    adjustmentType: row.adjustment_type,
    quantityBefore: row.quantity_before,
    quantityAfter: row.quantity_after,
    quantityChange: row.quantity_change,
    reason: row.reason,
    notes: row.notes,
    createdBy: row.created_by_name,
    createdAt: row.created_at,
  }));

  res.json({
    success: true,
    data: adjustments,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
}));

// GET /api/inventory/valuation - Get inventory valuation
router.get('/valuation', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { categoryId } = req.query;

  let whereConditions = ['i.is_active = true'];
  let queryParams: any[] = [];
  let paramCount = 0;

  if (categoryId) {
    paramCount++;
    whereConditions.push(`i.category_id = $${paramCount}`);
    queryParams.push(categoryId);
  }

  const whereClause = whereConditions.join(' AND ');

  const valuationResult = await query(
    `SELECT 
      i.id, i.name, i.sku, i.unit, i.current_stock,
      i.cost_price, i.selling_price,
      (i.current_stock * i.cost_price) as cost_value,
      (i.current_stock * i.selling_price) as selling_value,
      c.name as category_name
     FROM items i
     LEFT JOIN categories c ON i.category_id = c.id
     WHERE ${whereClause}
     ORDER BY (i.current_stock * i.cost_price) DESC`,
    queryParams
  );

  const items = valuationResult.rows.map(row => ({
    id: row.id,
    name: row.name,
    sku: row.sku,
    unit: row.unit,
    currentStock: row.current_stock,
    costPrice: parseFloat(row.cost_price),
    sellingPrice: parseFloat(row.selling_price),
    costValue: parseFloat(row.cost_value),
    sellingValue: parseFloat(row.selling_value),
    category: row.category_name,
  }));

  const totalCostValue = items.reduce((sum, item) => sum + item.costValue, 0);
  const totalSellingValue = items.reduce((sum, item) => sum + item.sellingValue, 0);
  const potentialProfit = totalSellingValue - totalCostValue;

  res.json({
    success: true,
    data: {
      items,
      summary: {
        totalItems: items.length,
        totalCostValue,
        totalSellingValue,
        potentialProfit,
        profitMargin: totalCostValue > 0 ? (potentialProfit / totalCostValue) * 100 : 0,
      },
    },
  });
}));

export default router;