import express from 'express';
import { validateRequest, commonSchemas } from '@/middleware/validation';
import { asyncHandler } from '@/middleware/errorHandler';
import { AuthenticatedRequest } from '@/middleware/auth';
import { query, transaction } from '@/database/connection';
import { generateOrderNumber } from '@/utils/helpers';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const createPurchaseSchema = {
  body: Joi.object({
    supplierId: Joi.string().uuid().required(),
    orderDate: Joi.date().required(),
    expectedDeliveryDate: Joi.date().optional(),
    items: Joi.array().items(
      Joi.object({
        itemId: Joi.string().uuid().required(),
        quantity: Joi.number().integer().min(1).required(),
        unitPrice: Joi.number().min(0).required(),
      })
    ).min(1).required(),
    taxRate: Joi.number().min(0).max(100).default(0),
    paymentMethod: Joi.string().valid('cash', 'credit', 'bank', 'check').default('credit'),
    notes: Joi.string().max(1000).optional(),
  }),
};

const updateReceivingSchema = {
  body: Joi.object({
    items: Joi.array().items(
      Joi.object({
        itemId: Joi.string().uuid().required(),
        receivedQuantity: Joi.number().integer().min(0).required(),
      })
    ).min(1).required(),
    receivedDate: Joi.date().optional(),
  }),
  params: Joi.object({
    id: commonSchemas.uuid,
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

// GET /api/purchases - Get all purchase orders
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { page = 1, limit = 10, search, status, supplierId } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let whereConditions = ['po.id IS NOT NULL'];
  let queryParams: any[] = [];
  let paramCount = 0;

  if (search) {
    paramCount++;
    whereConditions.push(`(po.order_number ILIKE $${paramCount} OR s.name ILIKE $${paramCount})`);
    queryParams.push(`%${search}%`);
  }

  if (status) {
    paramCount++;
    whereConditions.push(`po.status = $${paramCount}`);
    queryParams.push(status);
  }

  if (supplierId) {
    paramCount++;
    whereConditions.push(`po.supplier_id = $${paramCount}`);
    queryParams.push(supplierId);
  }

  const whereClause = whereConditions.join(' AND ');

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) as total FROM purchase_orders po 
     LEFT JOIN suppliers s ON po.supplier_id = s.id 
     WHERE ${whereClause}`,
    queryParams
  );
  const total = parseInt(countResult.rows[0].total);

  // Get purchase orders
  paramCount++;
  queryParams.push(Number(limit));
  paramCount++;
  queryParams.push(offset);

  const purchasesResult = await query(
    `SELECT 
      po.id, po.order_number, po.supplier_id, po.order_date, 
      po.expected_delivery_date, po.received_date, po.status,
      po.subtotal, po.tax_amount, po.total_amount, po.paid_amount,
      po.payment_method, po.notes, po.created_at, po.updated_at,
      s.name as supplier_name, s.phone as supplier_phone,
      COUNT(poi.id) as item_count
     FROM purchase_orders po
     LEFT JOIN suppliers s ON po.supplier_id = s.id
     LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
     WHERE ${whereClause}
     GROUP BY po.id, s.name, s.phone
     ORDER BY po.created_at DESC
     LIMIT $${paramCount - 1} OFFSET $${paramCount}`,
    queryParams
  );

  const purchases = purchasesResult.rows.map(row => ({
    id: row.id,
    orderNumber: row.order_number,
    supplierId: row.supplier_id,
    supplier: row.supplier_name,
    supplierPhone: row.supplier_phone,
    orderDate: row.order_date,
    expectedDeliveryDate: row.expected_delivery_date,
    receivedDate: row.received_date,
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
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  res.json({
    success: true,
    data: purchases,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
}));

// GET /api/purchases/:id - Get purchase order by ID
router.get('/:id', validateRequest({ params: Joi.object({ id: commonSchemas.uuid }) }), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;

  // Get purchase order with supplier details
  const purchaseResult = await query(
    `SELECT 
      po.*, s.name as supplier_name, s.phone as supplier_phone,
      s.email as supplier_email, s.address as supplier_address
     FROM purchase_orders po
     LEFT JOIN suppliers s ON po.supplier_id = s.id
     WHERE po.id = $1`,
    [id]
  );

  if (purchaseResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Purchase order not found',
    });
  }

  // Get purchase order items
  const itemsResult = await query(
    `SELECT 
      poi.id, poi.item_id, poi.quantity, poi.received_quantity,
      poi.unit_price, poi.total_price,
      i.name as item_name, i.sku, i.unit
     FROM purchase_order_items poi
     LEFT JOIN items i ON poi.item_id = i.id
     WHERE poi.purchase_order_id = $1`,
    [id]
  );

  const purchase = purchaseResult.rows[0];
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
    receivedQuantity: row.received_quantity,
    unitPrice: parseFloat(row.unit_price),
    totalPrice: parseFloat(row.total_price),
  }));

  res.json({
    success: true,
    data: {
      id: purchase.id,
      orderNumber: purchase.order_number,
      supplierId: purchase.supplier_id,
      supplier: {
        id: purchase.supplier_id,
        name: purchase.supplier_name,
        phone: purchase.supplier_phone,
        email: purchase.supplier_email,
        address: purchase.supplier_address,
      },
      orderDate: purchase.order_date,
      expectedDeliveryDate: purchase.expected_delivery_date,
      receivedDate: purchase.received_date,
      status: purchase.status,
      subtotal: parseFloat(purchase.subtotal),
      taxAmount: parseFloat(purchase.tax_amount),
      totalAmount: parseFloat(purchase.total_amount),
      paidAmount: parseFloat(purchase.paid_amount),
      remainingAmount: parseFloat(purchase.total_amount) - parseFloat(purchase.paid_amount),
      paymentMethod: purchase.payment_method,
      notes: purchase.notes,
      items,
      createdAt: purchase.created_at,
      updatedAt: purchase.updated_at,
    },
  });
}));

// POST /api/purchases - Create new purchase order
router.post('/', validateRequest(createPurchaseSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const {
    supplierId,
    orderDate,
    expectedDeliveryDate,
    items,
    taxRate,
    paymentMethod,
    notes,
  } = req.body;

  await transaction(async (client) => {
    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount;

    // Generate order number
    const orderNumber = generateOrderNumber('PO');

    // Create purchase order
    const purchaseResult = await client.query(
      `INSERT INTO purchase_orders (
        order_number, supplier_id, order_date, expected_delivery_date,
        subtotal, tax_amount, total_amount, payment_method, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        orderNumber, supplierId, orderDate, expectedDeliveryDate,
        subtotal, taxAmount, totalAmount, paymentMethod, notes, req.user!.id
      ]
    );

    const purchaseOrder = purchaseResult.rows[0];

    // Create purchase order items
    for (const item of items) {
      const totalPrice = item.quantity * item.unitPrice;
      
      await client.query(
        `INSERT INTO purchase_order_items (
          purchase_order_id, item_id, quantity, unit_price, total_price
        ) VALUES ($1, $2, $3, $4, $5)`,
        [purchaseOrder.id, item.itemId, item.quantity, item.unitPrice, totalPrice]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Purchase order created successfully',
      data: {
        id: purchaseOrder.id,
        orderNumber: purchaseOrder.order_number,
        supplierId: purchaseOrder.supplier_id,
        orderDate: purchaseOrder.order_date,
        expectedDeliveryDate: purchaseOrder.expected_delivery_date,
        status: purchaseOrder.status,
        subtotal: parseFloat(purchaseOrder.subtotal),
        taxAmount: parseFloat(purchaseOrder.tax_amount),
        totalAmount: parseFloat(purchaseOrder.total_amount),
        paidAmount: parseFloat(purchaseOrder.paid_amount),
        paymentMethod: purchaseOrder.payment_method,
        notes: purchaseOrder.notes,
        createdAt: purchaseOrder.created_at,
      },
    });
  });
}));

// PUT /api/purchases/:id/receive - Update receiving status
router.put('/:id/receive', validateRequest(updateReceivingSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { items, receivedDate } = req.body;

  await transaction(async (client) => {
    // Check if purchase order exists
    const purchaseResult = await client.query(
      'SELECT id, status FROM purchase_orders WHERE id = $1',
      [id]
    );

    if (purchaseResult.rows.length === 0) {
      throw new Error('Purchase order not found');
    }

    const purchase = purchaseResult.rows[0];

    if (purchase.status === 'received') {
      throw new Error('Purchase order already fully received');
    }

    // Update received quantities and stock levels
    let allReceived = true;
    let anyReceived = false;

    for (const item of items) {
      // Update received quantity
      const updateResult = await client.query(
        `UPDATE purchase_order_items 
         SET received_quantity = $1 
         WHERE purchase_order_id = $2 AND item_id = $3
         RETURNING quantity, received_quantity`,
        [item.receivedQuantity, id, item.itemId]
      );

      if (updateResult.rows.length === 0) {
        throw new Error(`Item ${item.itemId} not found in purchase order`);
      }

      const { quantity, received_quantity } = updateResult.rows[0];

      if (received_quantity < quantity) {
        allReceived = false;
      }
      if (received_quantity > 0) {
        anyReceived = true;
      }

      // Update item stock if quantity was received
      if (item.receivedQuantity > 0) {
        await client.query(
          'UPDATE items SET current_stock = current_stock + $1 WHERE id = $2',
          [item.receivedQuantity, item.itemId]
        );

        // Record inventory transaction
        await client.query(
          `INSERT INTO inventory_transactions (
            item_id, transaction_type, reference_id, quantity_change, created_by
          ) VALUES ($1, 'purchase', $2, $3, $4)`,
          [item.itemId, id, item.receivedQuantity, req.user!.id]
        );
      }
    }

    // Update purchase order status
    let newStatus = 'pending';
    if (allReceived) {
      newStatus = 'received';
    } else if (anyReceived) {
      newStatus = 'partial';
    }

    const updateData = [newStatus, id];
    let updateQuery = 'UPDATE purchase_orders SET status = $1, updated_at = CURRENT_TIMESTAMP';
    
    if (receivedDate && allReceived) {
      updateQuery += ', received_date = $3';
      updateData.splice(1, 0, receivedDate);
    }
    
    updateQuery += ' WHERE id = $' + updateData.length + ' RETURNING *';

    const updatedPurchase = await client.query(updateQuery, updateData);

    res.json({
      success: true,
      message: 'Receiving updated successfully',
      data: {
        id: updatedPurchase.rows[0].id,
        status: updatedPurchase.rows[0].status,
        receivedDate: updatedPurchase.rows[0].received_date,
        updatedAt: updatedPurchase.rows[0].updated_at,
      },
    });
  });
}));

// POST /api/purchases/:id/payments - Record payment
router.post('/:id/payments', validateRequest(recordPaymentSchema), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { amount, paymentMethod, paymentDate, referenceNumber, notes } = req.body;

  await transaction(async (client) => {
    // Get purchase order
    const purchaseResult = await client.query(
      'SELECT total_amount, paid_amount FROM purchase_orders WHERE id = $1',
      [id]
    );

    if (purchaseResult.rows.length === 0) {
      throw new Error('Purchase order not found');
    }

    const { total_amount, paid_amount } = purchaseResult.rows[0];
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
      ['purchase', id, amount, paymentMethod, paymentDate, referenceNumber, notes, req.user!.id]
    );

    // Update purchase order paid amount
    const newPaidAmount = parseFloat(paid_amount) + amount;
    await client.query(
      'UPDATE purchase_orders SET paid_amount = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPaidAmount, id]
    );

    // Update supplier balance
    await client.query(
      `UPDATE suppliers 
       SET current_balance = current_balance - $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = (SELECT supplier_id FROM purchase_orders WHERE id = $2)`,
      [amount, id]
    );

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        amount,
        paymentMethod,
        paymentDate,
        newPaidAmount,
        remainingAmount: parseFloat(total_amount) - newPaidAmount,
      },
    });
  });
}));

export default router;