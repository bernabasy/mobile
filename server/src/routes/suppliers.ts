import express from 'express';
import { validateRequest, commonSchemas } from '@/middleware/validation';
import { asyncHandler } from '@/middleware/errorHandler';
import { AuthenticatedRequest } from '@/middleware/auth';
import { query } from '@/database/connection';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const createSupplierSchema = {
  body: Joi.object({
    name: Joi.string().min(1).max(200).required(),
    contactPerson: Joi.string().max(100).optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().max(20).optional(),
    address: Joi.string().max(500).optional(),
    city: Joi.string().max(100).optional(),
    country: Joi.string().max(100).default('Ethiopia'),
    taxId: Joi.string().max(50).optional(),
    paymentTerms: Joi.string().max(100).default('Net 30'),
    creditLimit: Joi.number().min(0).default(0),
  }),
};

const updateSupplierSchema = {
  body: Joi.object({
    name: Joi.string().min(1).max(200).optional(),
    contactPerson: Joi.string().max(100).optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().max(20).optional(),
    address: Joi.string().max(500).optional(),
    city: Joi.string().max(100).optional(),
    country: Joi.string().max(100).optional(),
    taxId: Joi.string().max(50).optional(),
    paymentTerms: Joi.string().max(100).optional(),
    creditLimit: Joi.number().min(0).optional(),
    isActive: Joi.boolean().optional(),
  }),
  params: Joi.object({
    id: commonSchemas.uuid,
  }),
};

// GET /api/suppliers - Get all suppliers
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { page = 1, limit = 10, search, isActive = true } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let whereConditions = ['s.is_active = $1'];
  let queryParams: any[] = [isActive];
  let paramCount = 1;

  if (search) {
    paramCount++;
    whereConditions.push(`(s.name ILIKE $${paramCount} OR s.email ILIKE $${paramCount} OR s.phone ILIKE $${paramCount})`);
    queryParams.push(`%${search}%`);
  }

  const whereClause = whereConditions.join(' AND ');

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) as total FROM suppliers s WHERE ${whereClause}`,
    queryParams
  );
  const total = parseInt(countResult.rows[0].total);

  // Get suppliers with purchase statistics
  paramCount++;
  queryParams.push(Number(limit));
  paramCount++;
  queryParams.push(offset);

  const suppliersResult = await query(
    `SELECT 
      s.*,
      COALESCE(SUM(po.total_amount), 0) as total_purchases,
      COUNT(po.id) as purchase_count
     FROM suppliers s
     LEFT JOIN purchase_orders po ON s.id = po.supplier_id
     WHERE ${whereClause}
     GROUP BY s.id
     ORDER BY s.created_at DESC
     LIMIT $${paramCount - 1} OFFSET $${paramCount}`,
    queryParams
  );

  const suppliers = suppliersResult.rows.map(row => ({
    id: row.id,
    name: row.name,
    contactPerson: row.contact_person,
    email: row.email,
    phone: row.phone,
    address: row.address,
    city: row.city,
    country: row.country,
    taxId: row.tax_id,
    paymentTerms: row.payment_terms,
    creditLimit: parseFloat(row.credit_limit),
    currentBalance: parseFloat(row.current_balance),
    totalPurchases: parseFloat(row.total_purchases),
    purchaseCount: parseInt(row.purchase_count),
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  res.json({
    success: true,
    data: suppliers,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
}));

// GET /api/suppliers/:id - Get supplier by ID
router.get('/:id', validateRequest({ params: Joi.object({ id: commonSchemas.uuid }) }), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;

  const result = await query(
    `SELECT 
      s.*,
      COALESCE(SUM(po.total_amount), 0) as total_purchases,
      COUNT(po.id) as purchase_count
     FROM suppliers s
     LEFT JOIN purchase_orders po ON s.id = po.supplier_id
     WHERE s.id = $1
     GROUP BY s.id`,
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Supplier not found',
    });
  }

  const row = result.rows[0];
  const supplier = {
    id: row.id,
    name: row.name,
    contactPerson: row.contact_person,
    email: row.email,
    phone: row.phone,
    address: row.address,
    city: row.city,
    country: row.country,
    taxId: row.tax_id,
    paymentTerms: row.payment_terms,
    creditLimit: parseFloat(row.credit_limit),
    currentBalance: parseFloat(row.current_balance),
    totalPurchases: parseFloat(row.total_purchases),
    purchaseCount: parseInt(row.purchase_count),
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  res.json({
    success: true,
    data: supplier,
  });
}));

// POST /api/suppliers - Create new supplier
router.post('/', validateRequest(createSupplierSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const {
    name,
    contactPerson,
    email,
    phone,
    address,
    city,
    country,
    taxId,
    paymentTerms,
    creditLimit,
  } = req.body;

  // Check if email already exists (if provided)
  if (email) {
    const existingEmail = await query(
      'SELECT id FROM suppliers WHERE email = $1 AND is_active = true',
      [email]
    );
    if (existingEmail.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Email already exists',
      });
    }
  }

  const result = await query(
    `INSERT INTO suppliers (
      name, contact_person, email, phone, address, city, country,
      tax_id, payment_terms, credit_limit, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      name, contactPerson, email, phone, address, city, country,
      taxId, paymentTerms, creditLimit, req.user!.id
    ]
  );

  const newSupplier = result.rows[0];

  res.status(201).json({
    success: true,
    message: 'Supplier created successfully',
    data: {
      id: newSupplier.id,
      name: newSupplier.name,
      contactPerson: newSupplier.contact_person,
      email: newSupplier.email,
      phone: newSupplier.phone,
      address: newSupplier.address,
      city: newSupplier.city,
      country: newSupplier.country,
      taxId: newSupplier.tax_id,
      paymentTerms: newSupplier.payment_terms,
      creditLimit: parseFloat(newSupplier.credit_limit),
      currentBalance: parseFloat(newSupplier.current_balance),
      isActive: newSupplier.is_active,
      createdAt: newSupplier.created_at,
      updatedAt: newSupplier.updated_at,
    },
  });
}));

// PUT /api/suppliers/:id - Update supplier
router.put('/:id', validateRequest(updateSupplierSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Check if supplier exists
  const existingSupplier = await query('SELECT id FROM suppliers WHERE id = $1', [id]);
  if (existingSupplier.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Supplier not found',
    });
  }

  // If email is being updated, check for duplicates
  if (updates.email) {
    const existingEmail = await query(
      'SELECT id FROM suppliers WHERE email = $1 AND id != $2 AND is_active = true',
      [updates.email, id]
    );
    if (existingEmail.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Email already exists',
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
    `UPDATE suppliers 
     SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramCount}
     RETURNING *`,
    values
  );

  const updatedSupplier = result.rows[0];

  res.json({
    success: true,
    message: 'Supplier updated successfully',
    data: {
      id: updatedSupplier.id,
      name: updatedSupplier.name,
      contactPerson: updatedSupplier.contact_person,
      email: updatedSupplier.email,
      phone: updatedSupplier.phone,
      address: updatedSupplier.address,
      city: updatedSupplier.city,
      country: updatedSupplier.country,
      taxId: updatedSupplier.tax_id,
      paymentTerms: updatedSupplier.payment_terms,
      creditLimit: parseFloat(updatedSupplier.credit_limit),
      currentBalance: parseFloat(updatedSupplier.current_balance),
      isActive: updatedSupplier.is_active,
      createdAt: updatedSupplier.created_at,
      updatedAt: updatedSupplier.updated_at,
    },
  });
}));

// DELETE /api/suppliers/:id - Soft delete supplier
router.delete('/:id', validateRequest({ params: Joi.object({ id: commonSchemas.uuid }) }), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;

  const result = await query(
    'UPDATE suppliers SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id',
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Supplier not found',
    });
  }

  res.json({
    success: true,
    message: 'Supplier deleted successfully',
  });
}));

// GET /api/suppliers/:id/purchases - Get supplier purchase history
router.get('/:id/purchases', validateRequest({ params: Joi.object({ id: commonSchemas.uuid }) }), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  // Check if supplier exists
  const supplierResult = await query('SELECT id FROM suppliers WHERE id = $1', [id]);
  if (supplierResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Supplier not found',
    });
  }

  // Get purchase history
  const purchasesResult = await query(
    `SELECT 
      po.id, po.order_number, po.order_date, po.status,
      po.total_amount, po.paid_amount, po.payment_method,
      COUNT(poi.id) as item_count
     FROM purchase_orders po
     LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
     WHERE po.supplier_id = $1
     GROUP BY po.id
     ORDER BY po.created_at DESC
     LIMIT $2 OFFSET $3`,
    [id, Number(limit), offset]
  );

  const purchases = purchasesResult.rows.map(row => ({
    id: row.id,
    orderNumber: row.order_number,
    orderDate: row.order_date,
    status: row.status,
    totalAmount: parseFloat(row.total_amount),
    paidAmount: parseFloat(row.paid_amount),
    remainingAmount: parseFloat(row.total_amount) - parseFloat(row.paid_amount),
    paymentMethod: row.payment_method,
    itemCount: parseInt(row.item_count),
  }));

  res.json({
    success: true,
    data: purchases,
  });
}));

export default router;