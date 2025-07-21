import express from 'express';
import { validateRequest, commonSchemas } from '@/middleware/validation';
import { asyncHandler } from '@/middleware/errorHandler';
import { AuthenticatedRequest } from '@/middleware/auth';
import { query, transaction } from '@/database/connection';
import { generateSKU } from '@/utils/helpers';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const createItemSchema = {
  body: Joi.object({
    name: Joi.string().min(1).max(200).required(),
    categoryId: Joi.string().uuid().required(),
    description: Joi.string().max(1000).optional(),
    sku: Joi.string().max(100).optional(),
    barcode: Joi.string().max(100).optional(),
    unit: Joi.string().min(1).max(50).required(),
    minStock: Joi.number().integer().min(0).default(0),
    maxStock: Joi.number().integer().min(0).default(0),
    reorderLevel: Joi.number().integer().min(0).default(0),
    currentStock: Joi.number().integer().min(0).default(0),
    costPrice: Joi.number().min(0).required(),
    sellingPrice: Joi.number().min(0).required(),
    taxRate: Joi.number().min(0).max(100).default(0),
  }),
};

const updateItemSchema = {
  body: Joi.object({
    name: Joi.string().min(1).max(200).optional(),
    categoryId: Joi.string().uuid().optional(),
    description: Joi.string().max(1000).optional(),
    sku: Joi.string().max(100).optional(),
    barcode: Joi.string().max(100).optional(),
    unit: Joi.string().min(1).max(50).optional(),
    minStock: Joi.number().integer().min(0).optional(),
    maxStock: Joi.number().integer().min(0).optional(),
    reorderLevel: Joi.number().integer().min(0).optional(),
    currentStock: Joi.number().integer().min(0).optional(),
    costPrice: Joi.number().min(0).optional(),
    sellingPrice: Joi.number().min(0).optional(),
    taxRate: Joi.number().min(0).max(100).optional(),
    isActive: Joi.boolean().optional(),
  }),
  params: Joi.object({
    id: commonSchemas.uuid,
  }),
};

const querySchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().optional(),
    categoryId: Joi.string().uuid().optional(),
    lowStock: Joi.boolean().optional(),
    isActive: Joi.boolean().default(true),
  }),
};

// GET /api/items - Get all items with pagination and filtering
router.get('/', validateRequest(querySchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { page = 1, limit = 10, search, categoryId, lowStock, isActive } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let whereConditions = ['i.is_active = $1'];
  let queryParams: any[] = [isActive];
  let paramCount = 1;

  if (search) {
    paramCount++;
    whereConditions.push(`(i.name ILIKE $${paramCount} OR i.sku ILIKE $${paramCount} OR i.description ILIKE $${paramCount})`);
    queryParams.push(`%${search}%`);
  }

  if (categoryId) {
    paramCount++;
    whereConditions.push(`i.category_id = $${paramCount}`);
    queryParams.push(categoryId);
  }

  if (lowStock) {
    whereConditions.push('i.current_stock <= i.reorder_level');
  }

  const whereClause = whereConditions.join(' AND ');

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) as total FROM items i WHERE ${whereClause}`,
    queryParams
  );
  const total = parseInt(countResult.rows[0].total);

  // Get items with category information
  paramCount++;
  queryParams.push(Number(limit));
  paramCount++;
  queryParams.push(offset);

  const itemsResult = await query(
    `SELECT 
      i.id, i.name, i.category_id, i.description, i.sku, i.barcode, i.unit,
      i.min_stock, i.max_stock, i.reorder_level, i.current_stock,
      i.cost_price, i.selling_price, i.tax_rate, i.is_active,
      i.created_at, i.updated_at,
      c.name as category_name
     FROM items i
     LEFT JOIN categories c ON i.category_id = c.id
     WHERE ${whereClause}
     ORDER BY i.created_at DESC
     LIMIT $${paramCount - 1} OFFSET $${paramCount}`,
    queryParams
  );

  const items = itemsResult.rows.map(row => ({
    id: row.id,
    name: row.name,
    categoryId: row.category_id,
    category: row.category_name ? { id: row.category_id, name: row.category_name } : null,
    description: row.description,
    sku: row.sku,
    barcode: row.barcode,
    unit: row.unit,
    minStock: row.min_stock,
    maxStock: row.max_stock,
    reorderLevel: row.reorder_level,
    currentStock: row.current_stock,
    costPrice: parseFloat(row.cost_price),
    sellingPrice: parseFloat(row.selling_price),
    taxRate: parseFloat(row.tax_rate),
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  res.json({
    success: true,
    data: items,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
}));

// GET /api/items/:id - Get item by ID
router.get('/:id', validateRequest({ params: Joi.object({ id: commonSchemas.uuid }) }), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;

  const result = await query(
    `SELECT 
      i.id, i.name, i.category_id, i.description, i.sku, i.barcode, i.unit,
      i.min_stock, i.max_stock, i.reorder_level, i.current_stock,
      i.cost_price, i.selling_price, i.tax_rate, i.is_active,
      i.created_at, i.updated_at,
      c.name as category_name
     FROM items i
     LEFT JOIN categories c ON i.category_id = c.id
     WHERE i.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Item not found',
    });
  }

  const row = result.rows[0];
  const item = {
    id: row.id,
    name: row.name,
    categoryId: row.category_id,
    category: row.category_name ? { id: row.category_id, name: row.category_name } : null,
    description: row.description,
    sku: row.sku,
    barcode: row.barcode,
    unit: row.unit,
    minStock: row.min_stock,
    maxStock: row.max_stock,
    reorderLevel: row.reorder_level,
    currentStock: row.current_stock,
    costPrice: parseFloat(row.cost_price),
    sellingPrice: parseFloat(row.selling_price),
    taxRate: parseFloat(row.tax_rate),
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  res.json({
    success: true,
    data: item,
  });
}));

// POST /api/items - Create new item
router.post('/', validateRequest(createItemSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const {
    name,
    categoryId,
    description,
    sku,
    barcode,
    unit,
    minStock,
    maxStock,
    reorderLevel,
    currentStock,
    costPrice,
    sellingPrice,
    taxRate,
  } = req.body;

  // Generate SKU if not provided
  let finalSku = sku;
  if (!finalSku) {
    // Get category name for SKU generation
    const categoryResult = await query('SELECT name FROM categories WHERE id = $1', [categoryId]);
    if (categoryResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category ID',
      });
    }
    finalSku = generateSKU(name, categoryResult.rows[0].name);
  }

  // Check if SKU already exists
  const existingSku = await query('SELECT id FROM items WHERE sku = $1', [finalSku]);
  if (existingSku.rows.length > 0) {
    return res.status(409).json({
      success: false,
      error: 'SKU already exists',
    });
  }

  const result = await query(
    `INSERT INTO items (
      name, category_id, description, sku, barcode, unit,
      min_stock, max_stock, reorder_level, current_stock,
      cost_price, selling_price, tax_rate, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *`,
    [
      name, categoryId, description, finalSku, barcode, unit,
      minStock, maxStock, reorderLevel, currentStock,
      costPrice, sellingPrice, taxRate, req.user!.id
    ]
  );

  const newItem = result.rows[0];

  res.status(201).json({
    success: true,
    message: 'Item created successfully',
    data: {
      id: newItem.id,
      name: newItem.name,
      categoryId: newItem.category_id,
      description: newItem.description,
      sku: newItem.sku,
      barcode: newItem.barcode,
      unit: newItem.unit,
      minStock: newItem.min_stock,
      maxStock: newItem.max_stock,
      reorderLevel: newItem.reorder_level,
      currentStock: newItem.current_stock,
      costPrice: parseFloat(newItem.cost_price),
      sellingPrice: parseFloat(newItem.selling_price),
      taxRate: parseFloat(newItem.tax_rate),
      isActive: newItem.is_active,
      createdAt: newItem.created_at,
      updatedAt: newItem.updated_at,
    },
  });
}));

// PUT /api/items/:id - Update item
router.put('/:id', validateRequest(updateItemSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Check if item exists
  const existingItem = await query('SELECT id FROM items WHERE id = $1', [id]);
  if (existingItem.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Item not found',
    });
  }

  // If SKU is being updated, check for duplicates
  if (updates.sku) {
    const existingSku = await query('SELECT id FROM items WHERE sku = $1 AND id != $2', [updates.sku, id]);
    if (existingSku.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'SKU already exists',
      });
    }
  }

  // Build dynamic update query
  const updateFields = [];
  const values = [];
  let paramCount = 0;

  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      paramCount++;
      // Convert camelCase to snake_case
      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      updateFields.push(`${dbKey} = $${paramCount}`);
      values.push(value);
    }
  });

  if (updateFields.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No fields to update',
    });
  }

  paramCount++;
  values.push(id);

  const result = await query(
    `UPDATE items 
     SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramCount}
     RETURNING *`,
    values
  );

  const updatedItem = result.rows[0];

  res.json({
    success: true,
    message: 'Item updated successfully',
    data: {
      id: updatedItem.id,
      name: updatedItem.name,
      categoryId: updatedItem.category_id,
      description: updatedItem.description,
      sku: updatedItem.sku,
      barcode: updatedItem.barcode,
      unit: updatedItem.unit,
      minStock: updatedItem.min_stock,
      maxStock: updatedItem.max_stock,
      reorderLevel: updatedItem.reorder_level,
      currentStock: updatedItem.current_stock,
      costPrice: parseFloat(updatedItem.cost_price),
      sellingPrice: parseFloat(updatedItem.selling_price),
      taxRate: parseFloat(updatedItem.tax_rate),
      isActive: updatedItem.is_active,
      createdAt: updatedItem.created_at,
      updatedAt: updatedItem.updated_at,
    },
  });
}));

// DELETE /api/items/:id - Soft delete item
router.delete('/:id', validateRequest({ params: Joi.object({ id: commonSchemas.uuid }) }), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;

  const result = await query(
    'UPDATE items SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id',
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Item not found',
    });
  }

  res.json({
    success: true,
    message: 'Item deleted successfully',
  });
}));

// GET /api/items/low-stock - Get low stock items
router.get('/reports/low-stock', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const result = await query(
    `SELECT 
      i.id, i.name, i.category_id, i.sku, i.unit,
      i.current_stock, i.reorder_level, i.min_stock,
      i.cost_price, i.selling_price,
      c.name as category_name
     FROM items i
     LEFT JOIN categories c ON i.category_id = c.id
     WHERE i.current_stock <= i.reorder_level AND i.is_active = true
     ORDER BY (i.current_stock::float / NULLIF(i.reorder_level, 0)) ASC`
  );

  const lowStockItems = result.rows.map(row => ({
    id: row.id,
    name: row.name,
    categoryId: row.category_id,
    category: row.category_name ? { id: row.category_id, name: row.category_name } : null,
    sku: row.sku,
    unit: row.unit,
    currentStock: row.current_stock,
    reorderLevel: row.reorder_level,
    minStock: row.min_stock,
    costPrice: parseFloat(row.cost_price),
    sellingPrice: parseFloat(row.selling_price),
    status: row.current_stock === 0 ? 'critical' : 
            row.current_stock <= row.min_stock ? 'low' : 'reorder',
    stockValue: row.current_stock * parseFloat(row.cost_price),
  }));

  res.json({
    success: true,
    data: lowStockItems,
  });
}));

export default router;