import express from "express";
import { z } from "zod";
import {
  Purchase,
  CreatePurchaseRequest,
  ApiResponse,
  PaginatedResponse,
} from "../../shared/api";

export const purchaseRoutes = express.Router();

// In-memory storage for demonstration
let purchases: Purchase[] = [
  {
    id: "1",
    purchaseNumber: "PO-001",
    supplierId: "1",
    supplier: {
      id: "1",
      name: "Ethiopian Coffee Exporters",
      email: "contact@ethcoffee.com",
      phone: "+251-11-123-4567",
      address: "Bole Road 123",
      city: "Addis Ababa",
      country: "Ethiopia",
      taxId: "ETH-001234567",
      paymentTerms: "Net 30",
      creditLimit: 50000,
      currentBalance: 8750,
      totalPurchases: 125000,
      isActive: true,
      createdAt: new Date("2024-01-10"),
      updatedAt: new Date("2024-01-10"),
    },
    orderDate: new Date("2024-01-15"),
    expectedDate: new Date("2024-01-20"),
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
        quantity: 50,
        unitPrice: 850,
        totalPrice: 42500,
        receivedQuantity: 0,
      },
    ],
    subtotal: 42500,
    taxRate: 15,
    taxAmount: 6375,
    withholdingRate: 2,
    withholdingAmount: 850,
    totalAmount: 48025,
    paidAmount: 0,
    remainingAmount: 48025,
    paymentMethod: "credit",
    notes: "Urgent order for premium coffee beans",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    purchaseNumber: "PO-002",
    supplierId: "2",
    supplier: {
      id: "2",
      name: "Habesha Honey Suppliers",
      email: "info@habeshahoney.et",
      phone: "+251-11-234-5678",
      address: "Kazanchis District",
      city: "Addis Ababa",
      country: "Ethiopia",
      taxId: "ETH-001234568",
      paymentTerms: "Net 15",
      creditLimit: 25000,
      currentBalance: 3200,
      totalPurchases: 45000,
      isActive: true,
      createdAt: new Date("2024-01-12"),
      updatedAt: new Date("2024-01-12"),
    },
    orderDate: new Date("2024-01-12"),
    expectedDate: new Date("2024-01-15"),
    receivedDate: new Date("2024-01-14"),
    status: "received",
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
        quantity: 100,
        unitPrice: 450,
        totalPrice: 45000,
        receivedQuantity: 100,
      },
    ],
    subtotal: 45000,
    taxRate: 15,
    taxAmount: 6750,
    withholdingRate: 2,
    withholdingAmount: 900,
    totalAmount: 50850,
    paidAmount: 25000,
    remainingAmount: 25850,
    paymentMethod: "partial",
    notes: "Quality honey shipment",
    createdAt: new Date("2024-01-12"),
    updatedAt: new Date("2024-01-14"),
  },
];

let nextId = 3;
let nextPurchaseNumber = 3;

// Validation schemas
const createPurchaseSchema = z.object({
  supplierId: z.string().min(1),
  orderDate: z.string().transform((str) => new Date(str)),
  expectedDate: z
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
  notes: z.string().optional(),
});

// GET /api/purchases - List all purchases
purchaseRoutes.get("/", (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(
      1,
      Math.min(100, parseInt(req.query.limit as string) || 10),
    );
    const search = req.query.search as string;
    const status = req.query.status as string;

    let filteredPurchases = [...purchases];

    if (search) {
      const searchLower = search.toLowerCase();
      filteredPurchases = filteredPurchases.filter(
        (purchase) =>
          purchase.purchaseNumber.toLowerCase().includes(searchLower) ||
          purchase.supplier.name.toLowerCase().includes(searchLower),
      );
    }

    if (status) {
      filteredPurchases = filteredPurchases.filter(
        (purchase) => purchase.status === status,
      );
    }

    const total = filteredPurchases.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedPurchases = filteredPurchases.slice(offset, offset + limit);

    const response: PaginatedResponse<Purchase> = {
      success: true,
      data: paginatedPurchases,
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
      error: "Failed to fetch purchases",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/purchases/:id - Get specific purchase
purchaseRoutes.get("/:id", (req, res) => {
  try {
    const purchase = purchases.find(
      (purchase) => purchase.id === req.params.id,
    );

    if (!purchase) {
      return res.status(404).json({
        success: false,
        error: "Purchase not found",
      });
    }

    const response: ApiResponse<Purchase> = {
      success: true,
      data: purchase,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch purchase",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/purchases - Create new purchase
purchaseRoutes.post("/", (req, res) => {
  try {
    const validatedData = createPurchaseSchema.parse(req.body);

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
          costPrice: item.unitPrice,
          salesPrice: item.unitPrice * 1.3,
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
        receivedQuantity: 0,
      };
    });

    const taxAmount = (subtotal * validatedData.taxRate) / 100;
    const withholdingAmount = (subtotal * validatedData.withholdingRate) / 100;
    const totalAmount = subtotal + taxAmount - withholdingAmount;

    const newPurchase: Purchase = {
      id: nextId.toString(),
      purchaseNumber: `PO-${nextPurchaseNumber.toString().padStart(3, "0")}`,
      supplierId: validatedData.supplierId,
      supplier: {
        // Mock supplier data - in real app, fetch from suppliers table
        id: validatedData.supplierId,
        name: "Sample Supplier",
        email: "supplier@example.com",
        phone: "+251-11-000-0000",
        address: "Sample Address",
        city: "Addis Ababa",
        country: "Ethiopia",
        taxId: "ETH-000000000",
        paymentTerms: "Net 30",
        creditLimit: 50000,
        currentBalance: 0,
        totalPurchases: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      orderDate: validatedData.orderDate,
      expectedDate: validatedData.expectedDate,
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
      notes: validatedData.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    purchases.push(newPurchase);
    nextId++;
    nextPurchaseNumber++;

    const response: ApiResponse<Purchase> = {
      success: true,
      data: newPurchase,
      message: "Purchase created successfully",
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
      error: "Failed to create purchase",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// PUT /api/purchases/:id/receive - Receive purchase items
purchaseRoutes.put("/:id/receive", (req, res) => {
  try {
    const purchaseIndex = purchases.findIndex(
      (purchase) => purchase.id === req.params.id,
    );

    if (purchaseIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Purchase not found",
      });
    }

    const { items } = req.body;

    // Update received quantities
    const purchase = purchases[purchaseIndex];
    let allReceived = true;
    let partiallyReceived = false;

    purchase.items.forEach((item) => {
      const receivedItem = items.find((ri: any) => ri.itemId === item.itemId);
      if (receivedItem) {
        item.receivedQuantity = receivedItem.receivedQuantity;
      }

      if (item.receivedQuantity < item.quantity) {
        allReceived = false;
      }
      if (item.receivedQuantity > 0) {
        partiallyReceived = true;
      }
    });

    // Update status
    if (allReceived) {
      purchase.status = "received";
      purchase.receivedDate = new Date();
    } else if (partiallyReceived) {
      purchase.status = "partial";
    }

    purchase.updatedAt = new Date();

    const response: ApiResponse<Purchase> = {
      success: true,
      data: purchase,
      message: "Purchase receiving updated successfully",
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to update purchase receiving",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// PUT /api/purchases/:id/payment - Record payment
purchaseRoutes.put("/:id/payment", (req, res) => {
  try {
    const purchaseIndex = purchases.findIndex(
      (purchase) => purchase.id === req.params.id,
    );

    if (purchaseIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Purchase not found",
      });
    }

    const { amount } = req.body;

    const purchase = purchases[purchaseIndex];
    purchase.paidAmount += amount;
    purchase.remainingAmount = purchase.totalAmount - purchase.paidAmount;
    purchase.updatedAt = new Date();

    const response: ApiResponse<Purchase> = {
      success: true,
      data: purchase,
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
