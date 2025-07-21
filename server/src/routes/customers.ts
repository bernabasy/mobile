import express from 'express';
import { validateRequest, commonSchemas } from '@/middleware/validation';
import { asyncHandler } from '@/middleware/errorHandler';
import { AuthenticatedRequest } from '@/middleware/auth';
import { query } from '@/database/connection';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const createCustomerSchema = {
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

const updateCustomerSchema = {
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

// GET /api/customers - Get all customers
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { page = 1, limit = 10, search, isActive = true } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let whereConditions = ['c.is_active = $1'];
  let queryParams: any[] = [isActive];
  let paramCount = 1;

  if (search) {
    paramCount++;
    whereConditions.push(`(c.name ILIKE $${paramCount} OR c.email ILIKE $${paramCount} OR c.phone ILIKE $${paramCount})`);
    queryParams.push(`%${search}%`);
  }

  const whereClause = whereConditions.join(' AND ');

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) as total FROM customers c WHERE ${whereClause}`,
    queryParams
  );
  const total = parseInt(countResult.rows[0].total);

  // Get customers with sales statistics
  paramCount++;
  queryParams.push(Number(limit));
  paramCount++;
  queryParams.push(offset);

  const customersResult = await query(
    `SELECT 
      c.*,
      COALESCE(SUM(so.total_amount), 0) as total_sales,
      COUNT(so.id) as sales_count
     FROM customers c
     LEFT JOIN sales_orders so ON c.id = so.customer_id
     WHERE ${whereClause}
     GROUP BY c.id
     ORDER BY c.created_at DESC
     LIMIT $${paramCount - 1} OFFSET $${paramCount}`,
    queryParams
  );

  const customers = customersResult.rows.map(row => ({
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
    totalSales: parseFloat(row.total_sales),
    salesCount: parseInt(row.sales_count),
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  res.json({
    success: true,
    data: customers,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
}));

// GET /api/customers/:id - Get customer by ID
router.get('/:id', validateRequest({ params: Joi.object({ id: commonSchemas.uuid }) }), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;

  const result = await query(
    `SELECT 
      c.*,
      COALESCE(SUM(so.total_amount), 0) as total_sales,
      COUNT(so.id) as sales_count
     FROM customers c
     LEFT JOIN sales_orders so ON c.id = so.customer_id
     WHERE c.id = $1
     GROUP BY c.id`,
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Customer not found',
    });
  }

  const row = result.rows[0];
  const customer = {
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
    totalSales: parseFloat(row.total_sales),
    salesCount: parseInt(row.sales_count),
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  res.json({
    success: true,
    data: customer,
  });
}));

// POST /api/customers - Create new customer
router.post('/', validateRequest(createCustomerSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
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
      'SELECT id FROM customers WHERE email = $1 AND is_active = true',
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
    `INSERT INTO customers (
      name, contact_person, email, phone, address, city, country,
      tax_id, payment_terms, credit_limit, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      name, contactPerson, email, phone, address, city, country,
      taxId, paymentTerms, creditLimit, req.user!.id
    ]
  );

  const newCustomer = result.rows[0];

  res.status(201).json({
    success: true,
    message: 'Customer created successfully',
    data: {
      id: newCustomer.id,
      name: newCustomer.name,
      contactPerson: newCustomer.contact_person,
      email: newCustomer.email,
      phone: newCustomer.phone,
      address: newCustomer.address,
      city: newCustomer.city,
      country: newCustomer.country,
      taxId: newCustomer.tax_id,
      paymentTerms: newCustomer.payment_terms,
      creditLimit: parseFloat(newCustomer.credit_limit),
      currentBalance: parseFloat(newCustomer.current_balance),
      isActive: newCustomer.is_active,
      createdAt: newCustomer.created_at,
      updatedAt: newCustomer.updated_at,
    },
  });
}));

// PUT /api/customers/:id - Update customer
router.put('/:id', validateRequest(updateCustomerSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Check if customer exists
  const existingCustomer = await query('SELECT id FROM customers WHERE id = $1', [id]);
  if (existingCustomer.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Customer not found',
    });
  }

  // If email is being updated, check for duplicates
  if (updates.email) {
    const existingEmail = await query(
      'SELECT id FROM customers WHERE email = $1 AND id != $2 AND is_active = true',
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
    `UPDATE customers 
     SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramCount}
     RETURNING *`,
    values
  );

  const updatedCustomer = result.rows[0];

  res.json({
    success: true,
    message: 'Customer updated successfully',
    data: {
      id: updatedCustomer.id,
      name: updatedCustomer.name,
      contactPerson: updatedCustomer.contact_person,
      email: updatedCustomer.email,
      phone: updatedCustomer.phone,
      address: updatedCustomer.address,
      city: updatedCustomer.city,
      country: updatedCustomer.country,
      taxId: updatedCustomer.tax_id,
      paymentTerms: updatedCustomer.payment_terms,
      creditLimit: parseFloat(updatedCustomer.credit_limit),
      currentBalance: parseFloat(updatedCustomer.current_balance),
      isActive: updatedCustomer.is_active,
      createdAt: updatedCustomer.created_at,
      updatedAt: updatedCustomer.updated_at,
    },
  });
}));

// DELETE /api/customers/:id - Soft delete customer
router.delete('/:id', validateRequest({ params: Joi.object({ id: commonSchemas.uuid }) }), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;

  const result = await query(
    'UPDATE customers SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id',
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Customer not found',
    });
  }

  res.json({
    success: true,
    message: 'Customer deleted successfully',
  });
}));

// GET /api/customers/:id/sales - Get customer sales history
router.get('/:id/sales', validateRequest({ params: Joi.object({ id: commonSchemas.uuid }) }), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  // Check if customer exists
  const customerResult = await query('SELECT id FROM customers WHERE id = $1', [id]);
  if (customerResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Customer not found',
    });
  }

  // Get sales history
  const salesResult = await query(
    `SELECT 
      so.id, so.order_number, so.order_date, so.status,
      so.total_amount, so.paid_amount, so.payment_method,
      COUNT(soi.id) as item_count,
      u.firstname || ' ' || u.lastname as sales_person
     FROM sales_orders so
     LEFT JOIN sales_order_items soi ON so.id = soi.sales_order_id
     LEFT JOIN users u ON so.sales_person = u.id
     WHERE so.customer_id = $1
     GROUP BY so.id, u.firstname, u.lastname
     ORDER BY so.created_at DESC
     LIMIT $2 OFFSET $3`,
    [id, Number(limit), offset]
  );

  const sales = salesResult.rows.map(row => ({
    id: row.id,
    orderNumber: row.order_number,
    orderDate: row.order_date,
    status: row.status,
    totalAmount: parseFloat(row.total_amount),
    paidAmount: parseFloat(row.paid_amount),
    remainingAmount: parseFloat(row.total_amount) - parseFloat(row.paid_amount),
    paymentMethod: row.payment_method,
    itemCount: parseInt(row.item_count),
    salesPerson: row.sales_person,
  }));

  res.json({
    success: true,
    data: sales,
  });
}));

export default router;