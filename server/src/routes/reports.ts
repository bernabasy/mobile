import express from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { AuthenticatedRequest } from '@/middleware/auth';
import { query } from '@/database/connection';
import Joi from 'joi';

const router = express.Router();

// GET /api/reports/sales - Sales report
router.get('/sales', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { startDate, endDate, customerId, paymentMethod } = req.query;

  let whereConditions = ['so.status != \'cancelled\''];
  let queryParams: any[] = [];
  let paramCount = 0;

  if (startDate) {
    paramCount++;
    whereConditions.push(`so.order_date >= $${paramCount}`);
    queryParams.push(startDate);
  }

  if (endDate) {
    paramCount++;
    whereConditions.push(`so.order_date <= $${paramCount}`);
    queryParams.push(endDate);
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

  // Get sales summary
  const summaryResult = await query(
    `SELECT 
      COUNT(*) as total_orders,
      COALESCE(SUM(so.total_amount), 0) as total_sales,
      COALESCE(SUM(so.paid_amount), 0) as total_paid,
      COALESCE(SUM(so.total_amount - so.paid_amount), 0) as total_outstanding,
      COALESCE(AVG(so.total_amount), 0) as average_order_value
     FROM sales_orders so
     WHERE ${whereClause}`,
    queryParams
  );

  // Get sales by payment method
  const paymentMethodResult = await query(
    `SELECT 
      so.payment_method,
      COUNT(*) as order_count,
      COALESCE(SUM(so.total_amount), 0) as total_amount
     FROM sales_orders so
     WHERE ${whereClause}
     GROUP BY so.payment_method
     ORDER BY total_amount DESC`,
    queryParams
  );

  // Get top customers
  const topCustomersResult = await query(
    `SELECT 
      COALESCE(c.name, 'Walk-in Customer') as customer_name,
      COUNT(so.id) as order_count,
      COALESCE(SUM(so.total_amount), 0) as total_amount
     FROM sales_orders so
     LEFT JOIN customers c ON so.customer_id = c.id
     WHERE ${whereClause}
     GROUP BY c.id, c.name
     ORDER BY total_amount DESC
     LIMIT 10`,
    queryParams
  );

  // Get top selling items
  const topItemsResult = await query(
    `SELECT 
      i.name as item_name,
      i.sku,
      SUM(soi.quantity) as total_quantity,
      COALESCE(SUM(soi.total_price), 0) as total_revenue
     FROM sales_order_items soi
     JOIN sales_orders so ON soi.sales_order_id = so.id
     JOIN items i ON soi.item_id = i.id
     WHERE ${whereClause}
     GROUP BY i.id, i.name, i.sku
     ORDER BY total_revenue DESC
     LIMIT 10`,
    queryParams
  );

  const summary = summaryResult.rows[0];

  res.json({
    success: true,
    data: {
      summary: {
        totalOrders: parseInt(summary.total_orders),
        totalSales: parseFloat(summary.total_sales),
        totalPaid: parseFloat(summary.total_paid),
        totalOutstanding: parseFloat(summary.total_outstanding),
        averageOrderValue: parseFloat(summary.average_order_value),
      },
      paymentMethods: paymentMethodResult.rows.map(row => ({
        method: row.payment_method,
        orderCount: parseInt(row.order_count),
        totalAmount: parseFloat(row.total_amount),
      })),
      topCustomers: topCustomersResult.rows.map(row => ({
        customerName: row.customer_name,
        orderCount: parseInt(row.order_count),
        totalAmount: parseFloat(row.total_amount),
      })),
      topItems: topItemsResult.rows.map(row => ({
        itemName: row.item_name,
        sku: row.sku,
        totalQuantity: parseInt(row.total_quantity),
        totalRevenue: parseFloat(row.total_revenue),
      })),
    },
  });
}));

// GET /api/reports/purchases - Purchases report
router.get('/purchases', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { startDate, endDate, supplierId, status } = req.query;

  let whereConditions = ['po.status != \'cancelled\''];
  let queryParams: any[] = [];
  let paramCount = 0;

  if (startDate) {
    paramCount++;
    whereConditions.push(`po.order_date >= $${paramCount}`);
    queryParams.push(startDate);
  }

  if (endDate) {
    paramCount++;
    whereConditions.push(`po.order_date <= $${paramCount}`);
    queryParams.push(endDate);
  }

  if (supplierId) {
    paramCount++;
    whereConditions.push(`po.supplier_id = $${paramCount}`);
    queryParams.push(supplierId);
  }

  if (status) {
    paramCount++;
    whereConditions.push(`po.status = $${paramCount}`);
    queryParams.push(status);
  }

  const whereClause = whereConditions.join(' AND ');

  // Get purchases summary
  const summaryResult = await query(
    `SELECT 
      COUNT(*) as total_orders,
      COALESCE(SUM(po.total_amount), 0) as total_purchases,
      COALESCE(SUM(po.paid_amount), 0) as total_paid,
      COALESCE(SUM(po.total_amount - po.paid_amount), 0) as total_outstanding,
      COALESCE(AVG(po.total_amount), 0) as average_order_value
     FROM purchase_orders po
     WHERE ${whereClause}`,
    queryParams
  );

  // Get purchases by status
  const statusResult = await query(
    `SELECT 
      po.status,
      COUNT(*) as order_count,
      COALESCE(SUM(po.total_amount), 0) as total_amount
     FROM purchase_orders po
     WHERE ${whereClause}
     GROUP BY po.status
     ORDER BY total_amount DESC`,
    queryParams
  );

  // Get top suppliers
  const topSuppliersResult = await query(
    `SELECT 
      s.name as supplier_name,
      COUNT(po.id) as order_count,
      COALESCE(SUM(po.total_amount), 0) as total_amount
     FROM purchase_orders po
     JOIN suppliers s ON po.supplier_id = s.id
     WHERE ${whereClause}
     GROUP BY s.id, s.name
     ORDER BY total_amount DESC
     LIMIT 10`,
    queryParams
  );

  const summary = summaryResult.rows[0];

  res.json({
    success: true,
    data: {
      summary: {
        totalOrders: parseInt(summary.total_orders),
        totalPurchases: parseFloat(summary.total_purchases),
        totalPaid: parseFloat(summary.total_paid),
        totalOutstanding: parseFloat(summary.total_outstanding),
        averageOrderValue: parseFloat(summary.average_order_value),
      },
      statusBreakdown: statusResult.rows.map(row => ({
        status: row.status,
        orderCount: parseInt(row.order_count),
        totalAmount: parseFloat(row.total_amount),
      })),
      topSuppliers: topSuppliersResult.rows.map(row => ({
        supplierName: row.supplier_name,
        orderCount: parseInt(row.order_count),
        totalAmount: parseFloat(row.total_amount),
      })),
    },
  });
}));

// GET /api/reports/inventory - Inventory report
router.get('/inventory', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { categoryId, lowStock } = req.query;

  let whereConditions = ['i.is_active = true'];
  let queryParams: any[] = [];
  let paramCount = 0;

  if (categoryId) {
    paramCount++;
    whereConditions.push(`i.category_id = $${paramCount}`);
    queryParams.push(categoryId);
  }

  if (lowStock === 'true') {
    whereConditions.push('i.current_stock <= i.reorder_level');
  }

  const whereClause = whereConditions.join(' AND ');

  // Get inventory summary
  const summaryResult = await query(
    `SELECT 
      COUNT(*) as total_items,
      COALESCE(SUM(i.current_stock), 0) as total_stock_units,
      COALESCE(SUM(i.current_stock * i.cost_price), 0) as total_cost_value,
      COALESCE(SUM(i.current_stock * i.selling_price), 0) as total_selling_value,
      COUNT(CASE WHEN i.current_stock <= i.reorder_level THEN 1 END) as low_stock_items,
      COUNT(CASE WHEN i.current_stock = 0 THEN 1 END) as out_of_stock_items
     FROM items i
     WHERE ${whereClause}`,
    queryParams
  );

  // Get inventory by category
  const categoryResult = await query(
    `SELECT 
      c.name as category_name,
      COUNT(i.id) as item_count,
      COALESCE(SUM(i.current_stock), 0) as total_stock,
      COALESCE(SUM(i.current_stock * i.cost_price), 0) as cost_value,
      COALESCE(SUM(i.current_stock * i.selling_price), 0) as selling_value
     FROM items i
     LEFT JOIN categories c ON i.category_id = c.id
     WHERE ${whereClause}
     GROUP BY c.id, c.name
     ORDER BY cost_value DESC`,
    queryParams
  );

  // Get top value items
  const topValueItemsResult = await query(
    `SELECT 
      i.name as item_name,
      i.sku,
      i.current_stock,
      i.cost_price,
      i.selling_price,
      (i.current_stock * i.cost_price) as cost_value,
      (i.current_stock * i.selling_price) as selling_value,
      c.name as category_name
     FROM items i
     LEFT JOIN categories c ON i.category_id = c.id
     WHERE ${whereClause}
     ORDER BY (i.current_stock * i.cost_price) DESC
     LIMIT 10`,
    queryParams
  );

  const summary = summaryResult.rows[0];

  res.json({
    success: true,
    data: {
      summary: {
        totalItems: parseInt(summary.total_items),
        totalStockUnits: parseInt(summary.total_stock_units),
        totalCostValue: parseFloat(summary.total_cost_value),
        totalSellingValue: parseFloat(summary.total_selling_value),
        potentialProfit: parseFloat(summary.total_selling_value) - parseFloat(summary.total_cost_value),
        lowStockItems: parseInt(summary.low_stock_items),
        outOfStockItems: parseInt(summary.out_of_stock_items),
      },
      categoryBreakdown: categoryResult.rows.map(row => ({
        categoryName: row.category_name || 'Uncategorized',
        itemCount: parseInt(row.item_count),
        totalStock: parseInt(row.total_stock),
        costValue: parseFloat(row.cost_value),
        sellingValue: parseFloat(row.selling_value),
      })),
      topValueItems: topValueItemsResult.rows.map(row => ({
        itemName: row.item_name,
        sku: row.sku,
        currentStock: row.current_stock,
        costPrice: parseFloat(row.cost_price),
        sellingPrice: parseFloat(row.selling_price),
        costValue: parseFloat(row.cost_value),
        sellingValue: parseFloat(row.selling_value),
        category: row.category_name,
      })),
    },
  });
}));

// GET /api/reports/profit-loss - Profit & Loss report
router.get('/profit-loss', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { startDate, endDate } = req.query;

  let dateConditions = '';
  let queryParams: any[] = [];
  let paramCount = 0;

  if (startDate) {
    paramCount++;
    dateConditions += ` AND so.order_date >= $${paramCount}`;
    queryParams.push(startDate);
  }

  if (endDate) {
    paramCount++;
    dateConditions += ` AND so.order_date <= $${paramCount}`;
    queryParams.push(endDate);
  }

  // Calculate revenue (sales)
  const revenueResult = await query(
    `SELECT 
      COALESCE(SUM(so.total_amount), 0) as total_revenue,
      COALESCE(SUM(so.paid_amount), 0) as collected_revenue
     FROM sales_orders so
     WHERE so.status != 'cancelled' ${dateConditions}`,
    queryParams
  );

  // Calculate COGS (Cost of Goods Sold)
  const cogsResult = await query(
    `SELECT 
      COALESCE(SUM(soi.quantity * i.cost_price), 0) as total_cogs
     FROM sales_order_items soi
     JOIN sales_orders so ON soi.sales_order_id = so.id
     JOIN items i ON soi.item_id = i.id
     WHERE so.status != 'cancelled' ${dateConditions}`,
    queryParams
  );

  // Calculate expenses (this would need an expenses table in a real system)
  // For now, we'll use a placeholder
  const expensesResult = await query(
    `SELECT 0 as total_expenses` // Placeholder
  );

  const revenue = revenueResult.rows[0];
  const cogs = cogsResult.rows[0];
  const expenses = expensesResult.rows[0];

  const totalRevenue = parseFloat(revenue.total_revenue);
  const totalCogs = parseFloat(cogs.total_cogs);
  const totalExpenses = parseFloat(expenses.total_expenses);
  const grossProfit = totalRevenue - totalCogs;
  const netProfit = grossProfit - totalExpenses;
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  res.json({
    success: true,
    data: {
      revenue: {
        totalRevenue,
        collectedRevenue: parseFloat(revenue.collected_revenue),
        uncollectedRevenue: totalRevenue - parseFloat(revenue.collected_revenue),
      },
      costs: {
        costOfGoodsSold: totalCogs,
        operatingExpenses: totalExpenses,
        totalCosts: totalCogs + totalExpenses,
      },
      profit: {
        grossProfit,
        netProfit,
        grossMargin,
        netMargin,
      },
    },
  });
}));

export default router;