import express from 'express';
import { validateRequest, commonSchemas } from '@/middleware/validation';
import { asyncHandler } from '@/middleware/errorHandler';
import { AuthenticatedRequest } from '@/middleware/auth';
import { query, transaction } from '@/database/connection';
import { generateOrderNumber } from '@/utils/helpers';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const createSaleSchema = {
  body: Joi.object({
    customerId: Joi.string().uuid().optional(),
    customerName: Joi.string().max(200).optional(),
    customerPhone: Joi.string().max(20).optional(),
    orderDate: Joi.date().required(),
    deliveryDate: Joi.date().optional(),
    items: Joi.array().items(
      Joi.object({
        itemId: Joi.string().uuid().required(),
        quantity: Joi.number().integer().min(1).required(),
        unitPrice: Joi.number().min(0).required(),
      })
    ).min(1).required(),
    taxRate: Joi.number().min(0).max(100).default(0),
    paymentMethod: Joi.string().valid('cash', 'credit', 'bank', 'check').default('cash'),
    paidAmount: Joi.number().min(0).default(0),
    notes: Joi.string().max(1000).optional(),
  }),
};

const recordPaymentSchema = {
  body: Joi.object({
    amount: Joi.number().min(0).required(),
    paymentMethod: Joi.string().valid('cash', 'bank', 'check', 'mobile').required(),
    paymentDate: Joi.date().default(new Date()),
    referenceNumber: Joi.string().max(100).optional(),
    notes: Joi.string().max(500).optional(),
  }),
  params: Joi.object({
    id: commonSchemas.uuid,
  }),
};

// GET /api/sales - Get all sales orders
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { page = 1, limit = 10, search, status, customerId, paymentMethod } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let whereConditions = ['so.id IS NOT NULL'];
  let queryParams: any[] = [];
  let paramCount = 0;

  if (search) {
    paramCount++;
    whereConditions.push(`(so.order_number ILIKE $${paramCount} OR c.name ILIKE $${paramCount})`);
    queryParams.push(`%${search}%`);
  }

  if (status) {
    paramCount++;
    whereConditions.push(`so.status = $${paramCount}`);
    queryParams.push(status);
  }

  if (customerId) {
    paramCount++;
    whereConditions.push(`so.customer_id = $${paramCount}`);
    queryParams.push(customerId);
  }

  if (paymentMethod) {
    paramCount++;
    whereConditions.push(`so.payment_method = $${paramCount}`);
    queryParams.push(paymentMethod);
  }

  const whereClause = whereConditions.join(' AND ');

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) as total FROM sales_orders so 
     LEFT JOIN customers c ON so.customer_id = c.id 
     WHERE ${whereClause}`,
    queryParams
  );
  const total = parseInt(countResult.rows[0].total);

  // Get sales orders
  paramCount++;
  queryParams.push(Number(limit));
  paramCount++;
  queryParams.push(offset);

  const salesResult = await query(
    `SELECT 
      so.id, so.order_number, so.customer_id, so.order_date, 
      so.delivery_date, so.status, so.subtotal, so.tax_amount, 
      so.total_amount, so.paid_amount, so.payment_method, so.notes,
      so.created_at, so.updated_at,
      COALESCE(c.name, 'Walk-in Customer') as customer_name,
      c.phone as customer_phone,
      COUNT(soi.id) as item_count,
      u.firstname || ' ' || u.lastname as sales_person
     FROM sales_orders so
     LEFT JOIN customers c ON so.customer_id = c.id
     LEFT JOIN sales_order_items soi ON so.id = soi.sales_order_id
     LEFT JOIN users u ON so.sales_person = u.id
     WHERE ${whereClause}
     GROUP BY so.id, c.name, c.phone, u.firstname, u.lastname
     ORDER BY so.created_at DESC
     LIMIT $${paramCount - 1} OFFSET $${paramCount}`,
    queryParams
  );

  const sales = salesResult.rows.map(row => ({
    id: row.id,
    orderNumber: row.order_number,
    customerId: row.customer_id,
    customer: row.customer_name,
    customerPhone: row.customer_phone,
    orderDate: row.order_date,
    deliveryDate: row.delivery_date,
    status: row.status,
    subtotal: parseFloat(row.subtotal),
    taxAmount: parseFloat(row.tax_amount),
    totalAmount: parseFloat(row.total_amount),
    paidAmount: parseFloat(row.paid_amount),
    remainingAmount: parseFloat(row.total_amount) - parseFloat(row.paid_amount),
    paymentMethod: row.payment_method,
    paymentStatus: parseFloat(row.paid_amount) === 0 ? 'unpaid' : 
                   parseFloat(row.paid_amount) >= parseFloat(row.total_amount) ? 'paid' : 'partial',
    items: parseInt(row.item_count),
    salesPerson: row.sales_person,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  res.json({
    success: true,
    data: sales,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
}));

// GET /api/sales/:id - Get sales order by ID
router.get('/:id', validateRequest({ params: Joi.object({ id: commonSchemas.uuid }) }), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;

  // Get sales order with customer details
  const saleResult = await query(
    `SELECT 
      so.*, 
      COALESCE(c.name, 'Walk-in Customer') as customer_name,
      c.phone as customer_phone, c.email as customer_email,
      u.firstname || ' ' || u.lastname as sales_person
     FROM sales_orders so
     LEFT JOIN customers c ON so.customer_id = c.id
     LEFT JOIN users u ON so.sales_person = u.id
     WHERE so.id = $1`,
    [id]
  );

  if (saleResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Sales order not found',
    });
  }

  // Get sales order items
  const itemsResult = await query(
    `SELECT 
      soi.id, soi.item_id, soi.quantity, soi.unit_price, soi.total_price,
      i.name as item_name, i.sku, i.unit
     FROM sales_order_items soi
     LEFT JOIN items i ON soi.item_id = i.id
     WHERE soi.sales_order_id = $1`,
    [id]
  );

  const sale = saleResult.rows[0];
  const items = itemsResult.rows.map(row => ({
    id: row.id,
    itemId: row.item_id,
    item: {
      id: row.item_id,
      name: row.item_name,
      sku: row.sku,
      unit: row.unit,
    },
    quantity: row.quantity,
    unitPrice: parseFloat(row.unit_price),
    totalPrice: parseFloat(row.total_price),
  }));

  res.json({
    success: true,
    data: {
      id: sale.id,
      orderNumber: sale.order_number,
      customerId: sale.customer_id,
      customer: {
        id: sale.customer_id,
        name: sale.customer_name,
        phone: sale.customer_phone,
        email: sale.customer_email,
      },
      orderDate: sale.order_date,
      deliveryDate: sale.delivery_date,
      status: sale.status,
      subtotal: parseFloat(sale.subtotal),
      taxAmount: parseFloat(sale.tax_amount),
      totalAmount: parseFloat(sale.total_amount),
      paidAmount: parseFloat(sale.paid_amount),
      remainingAmount: parseFloat(sale.total_amount) - parseFloat(sale.paid_amount),
      paymentMethod: sale.payment_method,
      salesPerson: sale.sales_person,
      notes: sale.notes,
      items,
      createdAt: sale.created_at,
      updatedAt: sale.updated_at,
    },
  });
}));

// POST /api/sales - Create new sales order
router.post('/', validateRequest(createSaleSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const {
    customerId,
    customerName,
    customerPhone,
    orderDate,
    deliveryDate,
    items,
    taxRate,
    paymentMethod,
    paidAmount,
    notes,
  } = req.body;

  await transaction(async (client) => {
    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount;

    // Validate paid amount
    if (paidAmount > totalAmount) {
      throw new Error('Paid amount cannot exceed total amount');
    }

    // Generate order number
    const orderNumber = generateOrderNumber('SO');

    // Determine status based on payment
    let status = 'pending';
    if (paidAmount >= totalAmount) {
      status = 'completed';
    }

    // Create customer if not exists and customer info provided
    let finalCustomerId = customerId;
    if (!customerId && customerName) {
      const customerResult = await client.query(
        `INSERT INTO customers (name, phone, created_by)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [customerName, customerPhone, req.user!.id]
      );
      finalCustomerId = customerResult.rows[0].id;
    }

    // Create sales order
    const saleResult = await client.query(
      `INSERT INTO sales_orders (
        order_number, customer_id, order_date, delivery_date,
        subtotal, tax_amount, total_amount, paid_amount,
        payment_method, status, sales_person, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        orderNumber, finalCustomerId, orderDate, deliveryDate,
        subtotal, taxAmount, totalAmount, paidAmount,
        paymentMethod, status, req.user!.id, notes, req.user!.id
      ]
    );

    const salesOrder = saleResult.rows[0];

    // Create sales order items and update stock
    for (const item of items) {
      const totalPrice = item.quantity * item.unitPrice;
      
      // Check stock availability
      const stockResult = await client.query(
        'SELECT current_stock FROM items WHERE id = $1',
        [item.itemId]
      );

      if (stockResult.rows.length === 0) {
        throw new Error(`Item ${item.itemId} not found`);
      }

      const currentStock = stockResult.rows[0].current_stock;
      if (currentStock < item.quantity) {
        throw new Error(`Insufficient stock for item ${item.itemId}. Available: ${currentStock}, Required: ${item.quantity}`);
      }

      // Create sales order item
      await client.query(
        `INSERT INTO sales_order_items (
          sales_order_id, item_id, quantity, unit_price, total_price
        ) VALUES ($1, $2, $3, $4, $5)`,
        [salesOrder.id, item.itemId, item.quantity, item.unitPrice, totalPrice]
      );

      // Update item stock
      await client.query(
        'UPDATE items SET current_stock = current_stock - $1 WHERE id = $2',
        [item.quantity, item.itemId]
      );

      // Record inventory transaction
      await client.query(
        `INSERT INTO inventory_transactions (
          item_id, transaction_type, reference_id, quantity_change, created_by
        ) VALUES ($1, 'sale', $2, $3, $4)`,
        [item.itemId, salesOrder.id, -item.quantity, req.user!.id]
      );
    }

    // Record payment if amount > 0
    if (paidAmount > 0) {
      await client.query(
        `INSERT INTO payments (
          reference_type, reference_id, amount, payment_method, 
          payment_date, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        ['sale', salesOrder.id, paidAmount, paymentMethod, orderDate, req.user!.id]
      );

      // Update customer balance if credit sale
      if (finalCustomerId && paidAmount < totalAmount) {
        await client.query(
          'UPDATE customers SET current_balance = current_balance + $1 WHERE id = $2',
          [totalAmount - paidAmount, finalCustomerId]
        );
      }
    }

    res.status(201).json({
      success: true,
      message: 'Sales order created successfully',
      data: {
        id: salesOrder.id,
        orderNumber: salesOrder.order_number,
        customerId: salesOrder.customer_id,
        orderDate: salesOrder.order_date,
        deliveryDate: salesOrder.delivery_date,
        status: salesOrder.status,
        subtotal: parseFloat(salesOrder.subtotal),
        taxAmount: parseFloat(salesOrder.tax_amount),
        totalAmount: parseFloat(salesOrder.total_amount),
        paidAmount: parseFloat(salesOrder.paid_amount),
        remainingAmount: parseFloat(salesOrder.total_amount) - parseFloat(salesOrder.paid_amount),
        paymentMethod: salesOrder.payment_method,
        notes: salesOrder.notes,
        createdAt: salesOrder.created_at,
      },
    });
  });
}));

// POST /api/sales/:id/payments - Record payment
router.post('/:id/payments', validateRequest(recordPaymentSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { amount, paymentMethod, paymentDate, referenceNumber, notes } = req.body;

  await transaction(async (client) => {
    // Get sales order
    const saleResult = await client.query(
      'SELECT total_amount, paid_amount, customer_id FROM sales_orders WHERE id = $1',
      [id]
    );

    if (saleResult.rows.length === 0) {
      throw new Error('Sales order not found');
    }

    const { total_amount, paid_amount, customer_id } = saleResult.rows[0];
    const remainingAmount = parseFloat(total_amount) - parseFloat(paid_amount);

    if (amount > remainingAmount) {
      throw new Error('Payment amount exceeds remaining balance');
    }

    // Record payment
    await client.query(
      `INSERT INTO payments (
        reference_type, reference_id, amount, payment_method, 
        payment_date, reference_number, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      ['sale', id, amount, paymentMethod, paymentDate, referenceNumber, notes, req.user!.id]
    );

    // Update sales order paid amount
    const newPaidAmount = parseFloat(paid_amount) + amount;
    const newStatus = newPaidAmount >= parseFloat(total_amount) ? 'completed' : 'pending';
    
    await client.query(
      'UPDATE sales_orders SET paid_amount = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [newPaidAmount, newStatus, id]
    );

    // Update customer balance
    if (customer_id) {
      await client.query(
        'UPDATE customers SET current_balance = current_balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [amount, customer_id]
      );
    }

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        amount,
        paymentMethod,
        paymentDate,
        newPaidAmount,
        remainingAmount: parseFloat(total_amount) - newPaidAmount,
        newStatus,
      },
    });
  });
}));

// GET /api/sales/reports/today - Get today's sales report
router.get('/reports/today', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const todaysSalesResult = await query(
    `SELECT 
      COUNT(*) as transaction_count,
      COALESCE(SUM(total_amount), 0) as total_sales,
      COALESCE(SUM(paid_amount), 0) as total_paid,
      COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN paid_amount ELSE 0 END), 0) as cash_sales,
      COALESCE(SUM(CASE WHEN payment_method = 'bank' THEN paid_amount ELSE 0 END), 0) as bank_sales,
      COALESCE(SUM(CASE WHEN payment_method = 'check' THEN paid_amount ELSE 0 END), 0) as check_sales,
      COALESCE(SUM(CASE WHEN payment_method = 'credit' THEN total_amount - paid_amount ELSE 0 END), 0) as credit_sales
     FROM sales_orders 
     WHERE order_date = CURRENT_DATE AND status != 'cancelled'`
  );

  const stats = todaysSalesResult.rows[0];
  const averageSale = parseInt(stats.transaction_count) > 0 ? 
    parseFloat(stats.total_sales) / parseInt(stats.transaction_count) : 0;

  // Get recent sales
  const recentSalesResult = await query(
    `SELECT 
      so.id, so.order_number, so.total_amount, so.paid_amount,
      so.payment_method, so.created_at,
      COALESCE(c.name, 'Walk-in Customer') as customer_name,
      u.firstname || ' ' || u.lastname as sales_person
     FROM sales_orders so
     LEFT JOIN customers c ON so.customer_id = c.id
     LEFT JOIN users u ON so.sales_person = u.id
     WHERE so.order_date = CURRENT_DATE AND so.status != 'cancelled'
     ORDER BY so.created_at DESC
     LIMIT 10`
  );

  res.json({
    success: true,
    data: {
      transactionCount: parseInt(stats.transaction_count),
      totalSales: parseFloat(stats.total_sales),
      totalPaid: parseFloat(stats.total_paid),
      cashSales: parseFloat(stats.cash_sales),
      bankSales: parseFloat(stats.bank_sales),
      checkSales: parseFloat(stats.check_sales),
      creditSales: parseFloat(stats.credit_sales),
      averageSale,
      recentSales: recentSalesResult.rows.map(row => ({
        id: row.id,
        orderNumber: row.order_number,
        customer: row.customer_name,
        amount: parseFloat(row.total_amount),
        paidAmount: parseFloat(row.paid_amount),
        paymentMethod: row.payment_method,
        salesPerson: row.sales_person,
        time: row.created_at,
      })),
    },
  });
}));

export default router;