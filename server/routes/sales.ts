import express from "express";
import { z } from "zod";
import {
  Sale,
  CreateSaleRequest,
  ApiResponse,
  PaginatedResponse,
} from "../../shared/api";

export const saleRoutes = express.Router();

// In-memory storage for demonstration
let sales: Sale[] = [
  {
    id: "1",
    saleNumber: "SO-001",
    customerId: "1",
    customer: {
      id: "1",
      name: "Meron's Coffee Shop",
      email: "meron@coffeeshop.et",
      phone: "+251-911-123456",
      address: "Bole Road 456",
      city: "Addis Ababa",
      country: "Ethiopia",
      taxId: "ETH-C001234567",
      paymentTerms: "Net 15",
      creditLimit: 15000,
      currentBalance: 2500,
      totalSales: 45000,
      isActive: true,
      createdAt: new Date("2024-01-10"),
      updatedAt: new Date("2024-01-10"),
    },
    saleDate: new Date("2024-01-15"),
    dueDate: new Date("2024-01-30"),
    status: "pending",
    items: [
      {
        id: "1",
        itemId: "1",
        item: {
          id: "1",
          name: "Coffee Beans Premium",
          category: "Beverages",
          description: "High-quality Arabica coffee beans",
          sku: "COF-001",
          barcode: "1234567890123",
          unit: "kg",
          minStock: 10,
          maxStock: 100,
          costPrice: 850,
          salesPrice: 1200,
          taxRate: 15,
          reorderLevel: 15,
          currentStock: 45,
          valuationMethod: "FIFO",
          variants: [],
          isActive: true,
          createdAt: new Date("2024-01-15"),
          updatedAt: new Date("2024-01-15"),
        },
        quantity: 25,
        unitPrice: 1200,
        totalPrice: 30000,
      },
    ],
    subtotal: 30000,
    taxRate: 15,
    taxAmount: 4500,
    withholdingRate: 2,
    withholdingAmount: 600,
    totalAmount: 33900,
    paidAmount: 20000,
    remainingAmount: 13900,
    paymentMethod: "partial",
    salesPerson: "Ahmed Hassan",
    notes: "Bulk order for coffee shop",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    saleNumber: "SO-002",
    customerId: "2",
    customer: {
      id: "2",
      name: "Habesha Restaurant",
      email: "info@habesharestaurant.et",
      phone: "+251-911-234567",
      address: "Kazanchis District",
      city: "Addis Ababa",
      country: "Ethiopia",
      taxId: "ETH-C001234568",
      paymentTerms: "Net 30",
      creditLimit: 25000,
      currentBalance: 8500,
      totalSales: 78000,
      isActive: true,
      createdAt: new Date("2024-01-08"),
      updatedAt: new Date("2024-01-08"),
    },
    saleDate: new Date("2024-01-14"),
    status: "paid",
    items: [
      {
        id: "2",
        itemId: "2",
        item: {
          id: "2",
          name: "Ethiopian Honey",
          category: "Food",
          description: "Pure natural honey",
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
        quantity: 20,
        unitPrice: 650,
        totalPrice: 13000,
      },
    ],
    subtotal: 13000,
    taxRate: 15,
    taxAmount: 1950,
    withholdingRate: 0,
    withholdingAmount: 0,
    totalAmount: 14950,
    paidAmount: 14950,
    remainingAmount: 0,
    paymentMethod: "cash",
    salesPerson: "Fatima Mohammed",
    notes: "Restaurant weekly order",
    createdAt: new Date("2024-01-14"),
    updatedAt: new Date("2024-01-14"),
  },
];

let nextId = 3;
let nextSaleNumber = 3;

// Validation schemas
const createSaleSchema = z.object({
  customerId: z.string().min(1),
  saleDate: z.string().transform((str) => new Date(str)),
  dueDate: z
    .string()
    .optional()
    .transform((str) => (str ? new Date(str) : undefined)),
  items: z.array(
    z.object({
      itemId: z.string().min(1),
      quantity: z.number().min(1),
      unitPrice: z.number().min(0),
    }),
  ),
  taxRate: z.number().min(0).max(100),
  withholdingRate: z.number().min(0).max(100),
  paymentMethod: z.enum(["cash", "bank", "check", "credit"]),
  salesPerson: z.string().min(1),
  notes: z.string().optional(),
});

// GET /api/sales - List all sales
saleRoutes.get("/", (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(
      1,
      Math.min(100, parseInt(req.query.limit as string) || 10),
    );
    const search = req.query.search as string;
    const status = req.query.status as string;

    let filteredSales = [...sales];

    if (search) {
      const searchLower = search.toLowerCase();
      filteredSales = filteredSales.filter(
        (sale) =>
          sale.saleNumber.toLowerCase().includes(searchLower) ||
          sale.customer.name.toLowerCase().includes(searchLower),
      );
    }

    if (status) {
      filteredSales = filteredSales.filter((sale) => sale.status === status);
    }

    const total = filteredSales.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedSales = filteredSales.slice(offset, offset + limit);

    const response: PaginatedResponse<Sale> = {
      success: true,
      data: paginatedSales,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch sales",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/sales/:id - Get specific sale
saleRoutes.get("/:id", (req, res) => {
  try {
    const sale = sales.find((sale) => sale.id === req.params.id);

    if (!sale) {
      return res.status(404).json({
        success: false,
        error: "Sale not found",
      });
    }

    const response: ApiResponse<Sale> = {
      success: true,
      data: sale,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch sale",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/sales - Create new sale
saleRoutes.post("/", (req, res) => {
  try {
    const validatedData = createSaleSchema.parse(req.body);

    // Calculate totals
    let subtotal = 0;
    const items = validatedData.items.map((item, index) => {
      const totalPrice = item.quantity * item.unitPrice;
      subtotal += totalPrice;

      return {
        id: `${nextId}-item-${index + 1}`,
        itemId: item.itemId,
        item: {
          // Mock item data - in real app, fetch from items table
          id: item.itemId,
          name: "Sample Item",
          category: "Sample",
          description: "Sample item",
          sku: `ITEM-${item.itemId}`,
          unit: "pcs",
          minStock: 10,
          maxStock: 100,
          costPrice: item.unitPrice * 0.7,
          salesPrice: item.unitPrice,
          taxRate: 15,
          reorderLevel: 15,
          currentStock: 50,
          valuationMethod: "FIFO" as const,
          variants: [],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice,
      };
    });

    const taxAmount = (subtotal * validatedData.taxRate) / 100;
    const withholdingAmount = (subtotal * validatedData.withholdingRate) / 100;
    const totalAmount = subtotal + taxAmount - withholdingAmount;

    const newSale: Sale = {
      id: nextId.toString(),
      saleNumber: `SO-${nextSaleNumber.toString().padStart(3, "0")}`,
      customerId: validatedData.customerId,
      customer: {
        // Mock customer data - in real app, fetch from customers table
        id: validatedData.customerId,
        name: "Sample Customer",
        email: "customer@example.com",
        phone: "+251-911-000000",
        address: "Sample Address",
        city: "Addis Ababa",
        country: "Ethiopia",
        paymentTerms: "Net 30",
        creditLimit: 50000,
        currentBalance: 0,
        totalSales: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      saleDate: validatedData.saleDate,
      dueDate: validatedData.dueDate,
      status: "pending",
      items,
      subtotal,
      taxRate: validatedData.taxRate,
      taxAmount,
      withholdingRate: validatedData.withholdingRate,
      withholdingAmount,
      totalAmount,
      paidAmount: 0,
      remainingAmount: totalAmount,
      paymentMethod: validatedData.paymentMethod,
      salesPerson: validatedData.salesPerson,
      notes: validatedData.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    sales.push(newSale);
    nextId++;
    nextSaleNumber++;

    const response: ApiResponse<Sale> = {
      success: true,
      data: newSale,
      message: "Sale created successfully",
    };

    res.status(201).json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", "),
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to create sale",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// PUT /api/sales/:id/payment - Record payment
saleRoutes.put("/:id/payment", (req, res) => {
  try {
    const saleIndex = sales.findIndex((sale) => sale.id === req.params.id);

    if (saleIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Sale not found",
      });
    }

    const { amount } = req.body;

    const sale = sales[saleIndex];
    sale.paidAmount += amount;
    sale.remainingAmount = sale.totalAmount - sale.paidAmount;

    // Update status based on payment
    if (sale.remainingAmount <= 0) {
      sale.status = "paid";
    } else if (sale.paidAmount > 0) {
      sale.status = "partial";
    }

    sale.updatedAt = new Date();

    const response: ApiResponse<Sale> = {
      success: true,
      data: sale,
      message: "Payment recorded successfully",
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to record payment",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/sales/reports/today - Get today's sales report
saleRoutes.get("/reports/today", (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySales = sales.filter((sale) => {
      const saleDate = new Date(sale.saleDate);
      saleDate.setHours(0, 0, 0, 0);
      return saleDate.getTime() === today.getTime();
    });

    const totalSales = todaySales.reduce(
      (sum, sale) => sum + sale.totalAmount,
      0,
    );
    const cashSales = todaySales
      .filter((sale) => sale.paymentMethod === "cash")
      .reduce((sum, sale) => sum + sale.totalAmount, 0);
    const bankSales = todaySales
      .filter((sale) => sale.paymentMethod === "bank")
      .reduce((sum, sale) => sum + sale.totalAmount, 0);
    const checkSales = todaySales
      .filter((sale) => sale.paymentMethod === "check")
      .reduce((sum, sale) => sum + sale.totalAmount, 0);

    const response: ApiResponse<any> = {
      success: true,
      data: {
        totalSales,
        salesCount: todaySales.length,
        cashSales,
        bankSales,
        checkSales,
        sales: todaySales,
        averageTicket:
          todaySales.length > 0 ? totalSales / todaySales.length : 0,
      },
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch today's sales report",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
