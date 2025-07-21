import express from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { AuthenticatedRequest } from '@/middleware/auth';
import { query } from '@/database/connection';

const router = express.Router();

// GET /api/dashboard/stats - Get dashboard statistics
router.get('/stats', asyncHandler(async (req: AuthenticatedRequest, res) => {
  // Get total items
  const itemsResult = await query(
    'SELECT COUNT(*) as total FROM items WHERE is_active = true'
  );
  const totalItems = parseInt(itemsResult.rows[0].total);

  // Get low stock items count
  const lowStockResult = await query(
    'SELECT COUNT(*) as total FROM items WHERE current_stock <= reorder_level AND is_active = true'
  );
  const lowStockItems = parseInt(lowStockResult.rows[0].total);

  // Get total suppliers
  const suppliersResult = await query(
    'SELECT COUNT(*) as total FROM suppliers WHERE is_active = true'
  );
  const totalSuppliers = parseInt(suppliersResult.rows[0].total);

  // Get total customers
  const customersResult = await query(
    'SELECT COUNT(*) as total FROM customers WHERE is_active = true'
  );
  const totalCustomers = parseInt(customersResult.rows[0].total);

  // Get today's sales
  const todaysSalesResult = await query(
    `SELECT COALESCE(SUM(total_amount), 0) as total 
     FROM sales_orders 
     WHERE order_date = CURRENT_DATE AND status != 'cancelled'`
  );
  const todaysSales = parseFloat(todaysSalesResult.rows[0].total);

  // Get today's purchases
  const todaysPurchasesResult = await query(
    `SELECT COALESCE(SUM(total_amount), 0) as total 
     FROM purchase_orders 
     WHERE order_date = CURRENT_DATE AND status != 'cancelled'`
  );
  const todaysPurchases = parseFloat(todaysPurchasesResult.rows[0].total);

  // Get inventory value
  const inventoryValueResult = await query(
    `SELECT COALESCE(SUM(current_stock * cost_price), 0) as total 
     FROM items 
     WHERE is_active = true`
  );
  const inventoryValue = parseFloat(inventoryValueResult.rows[0].total);

  // Get pending orders count
  const pendingOrdersResult = await query(
    `SELECT 
      (SELECT COUNT(*) FROM purchase_orders WHERE status = 'pending') as pending_purchases,
      (SELECT COUNT(*) FROM sales_orders WHERE status = 'pending') as pending_sales`
  );
  const pendingData = pendingOrdersResult.rows[0];
  const pendingOrders = parseInt(pendingData.pending_purchases) + parseInt(pendingData.pending_sales);

  // Get credit amounts
  const creditResult = await query(
    `SELECT 
      COALESCE(SUM(current_balance), 0) as supplier_credit,
      (SELECT COALESCE(SUM(current_balance), 0) FROM customers WHERE is_active = true) as customer_credit
     FROM suppliers 
     WHERE is_active = true`
  );
  const creditData = creditResult.rows[0];

  const stats = {
    totalItems,
    lowStockItems,
    totalSuppliers,
    totalCustomers,
    todaysSales,
    todaysPurchases,
    inventoryValue,
    pendingOrders,
    totalCredit: parseFloat(creditData.supplier_credit), // Amount we owe to suppliers
    totalDebit: parseFloat(creditData.customer_credit), // Amount customers owe us
  };

  res.json({
    success: true,
    data: stats,
  });
}));

// GET /api/dashboard/recent-activities - Get recent activities
router.get('/recent-activities', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const recentActivities = await query(
    `(SELECT 
      'sale' as type,
      so.id,
      so.order_number as reference,
      c.name as entity_name,
      so.total_amount as amount,
      so.created_at
     FROM sales_orders so
     LEFT JOIN customers c ON so.customer_id = c.id
     WHERE so.created_at >= CURRENT_DATE - INTERVAL '7 days'
     ORDER BY so.created_at DESC
     LIMIT 5)
     
     UNION ALL
     
     (SELECT 
      'purchase' as type,
      po.id,
      po.order_number as reference,
      s.name as entity_name,
      po.total_amount as amount,
      po.created_at
     FROM purchase_orders po
     LEFT JOIN suppliers s ON po.supplier_id = s.id
     WHERE po.created_at >= CURRENT_DATE - INTERVAL '7 days'
     ORDER BY po.created_at DESC
     LIMIT 5)
     
     ORDER BY created_at DESC
     LIMIT 10`
  );

  res.json({
    success: true,
    data: recentActivities.rows,
  });
}));

// GET /api/dashboard/sales-chart - Get sales data for chart
router.get('/sales-chart', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { period = '7days' } = req.query;

  let interval = '7 days';
  let dateFormat = 'YYYY-MM-DD';

  if (period === '30days') {
    interval = '30 days';
  } else if (period === '12months') {
    interval = '12 months';
    dateFormat = 'YYYY-MM';
  }

  const salesData = await query(
    `SELECT 
      TO_CHAR(order_date, $1) as period,
      COALESCE(SUM(total_amount), 0) as total_sales,
      COUNT(*) as order_count
     FROM sales_orders 
     WHERE order_date >= CURRENT_DATE - INTERVAL $2
       AND status != 'cancelled'
     GROUP BY TO_CHAR(order_date, $1)
     ORDER BY period`,
    [dateFormat, interval]
  );

  res.json({
    success: true,
    data: salesData.rows,
  });
}));

export default router;