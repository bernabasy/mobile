import express from "express";
import { DashboardStats, LowStockAlert, ApiResponse } from "../../shared/api";

export const dashboardRoutes = express.Router();

// GET /api/dashboard/stats - Get dashboard statistics
dashboardRoutes.get("/stats", (req, res) => {
  try {
    // Mock dashboard data
    const stats: DashboardStats = {
      inventoryValue: 68800,
      todaySales: 15750,
      lowStockItems: 3,
      totalSuppliers: 12,
      totalCustomers: 45,
      pendingPurchases: 5,
      pendingSales: 8,
      totalCredit: 8750, // Total credit of suppliers
      totalDebit: 12500, // Total debit of customers
    };

    const response: ApiResponse<DashboardStats> = {
      success: true,
      data: stats,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch dashboard stats",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/dashboard/low-stock - Get low stock alerts
dashboardRoutes.get("/low-stock", (req, res) => {
  try {
    // Mock low stock data
    const lowStockAlerts: LowStockAlert[] = [
      {
        item: {
          id: "2",
          name: "Ethiopian Honey",
          category: "Food",
          description: "Pure natural honey from Ethiopian beekeepers",
          sku: "HON-001",
          barcode: "1234567890124",
          unit: "bottle",
          minStock: 20,
          maxStock: 200,
          costPrice: 450,
          salesPrice: 650,
          taxRate: 15,
          reorderLevel: 25,
          currentStock: 8,
          valuationMethod: "FIFO",
          variants: [],
          isActive: true,
          createdAt: new Date("2024-01-10"),
          updatedAt: new Date("2024-01-10"),
        },
        currentStock: 8,
        reorderLevel: 25,
        status: "critical",
        daysWithoutSales: 5,
        suggestedOrderQuantity: 50,
        currentStockValue: 3600,
        store: {
          id: "1",
          name: "Main Store",
          location: "Downtown",
          responsibleUser: "Ahmed Hassan",
          phone: "+251-911-123456",
          email: "ahmed@store.com",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      {
        item: {
          id: "4",
          name: "Berbere Spice Mix",
          category: "Spices",
          description: "Traditional Ethiopian spice blend",
          sku: "BER-001",
          unit: "kg",
          minStock: 15,
          maxStock: 150,
          costPrice: 320,
          salesPrice: 480,
          taxRate: 15,
          reorderLevel: 20,
          currentStock: 12,
          valuationMethod: "FIFO",
          variants: [],
          isActive: true,
          createdAt: new Date("2024-01-14"),
          updatedAt: new Date("2024-01-14"),
        },
        currentStock: 12,
        reorderLevel: 20,
        status: "low",
        daysWithoutSales: 2,
        suggestedOrderQuantity: 30,
        currentStockValue: 3840,
        store: {
          id: "1",
          name: "Main Store",
          location: "Downtown",
          responsibleUser: "Ahmed Hassan",
          phone: "+251-911-123456",
          email: "ahmed@store.com",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    ];

    const response: ApiResponse<LowStockAlert[]> = {
      success: true,
      data: lowStockAlerts,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch low stock alerts",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/dashboard/recent-transactions - Get recent transactions
dashboardRoutes.get("/recent-transactions", (req, res) => {
  try {
    const recentTransactions = [
      {
        id: "1",
        type: "sale",
        customer: "Meron Tadesse",
        amount: 1450,
        items: "Coffee Beans x2",
        time: "14:30",
        paymentMethod: "cash",
      },
      {
        id: "2",
        type: "sale",
        customer: "Dawit Bekele",
        amount: 2100,
        items: "Honey x3",
        time: "13:15",
        paymentMethod: "bank",
      },
      {
        id: "3",
        type: "sale",
        customer: "Sara Mohammed",
        amount: 850,
        items: "Injera Mix x1",
        time: "12:45",
        paymentMethod: "cash",
      },
    ];

    const response: ApiResponse<typeof recentTransactions> = {
      success: true,
      data: recentTransactions,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch recent transactions",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/dashboard/today-sales - Get today's sales summary
dashboardRoutes.get("/today-sales", (req, res) => {
  try {
    const todaysSales = {
      totalSales: 15750,
      totalExpenses: 3200,
      netSales: 12550,
      salesByMethod: {
        cash: 8950,
        bank: 4300,
        check: 2500,
      },
      transactionCount: 24,
      averageTicket: 656,
    };

    const response: ApiResponse<typeof todaysSales> = {
      success: true,
      data: todaysSales,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch today's sales",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
