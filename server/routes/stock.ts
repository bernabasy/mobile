import express from "express";
import { z } from "zod";
import {
  StockTransfer,
  StockCount,
  CreateStockTransferRequest,
  CreateStockCountRequest,
  ApiResponse,
  PaginatedResponse,
} from "../../shared/api";

export const stockRoutes = express.Router();

// In-memory storage for demonstration
let stockTransfers: StockTransfer[] = [
  {
    id: "1",
    transferNumber: "TR-001",
    fromStoreId: "1",
    toStoreId: "2",
    fromStore: {
      id: "1",
      name: "Main Store",
      location: "Downtown Addis Ababa",
      responsibleUser: "Ahmed Hassan",
      phone: "+251-911-123456",
      email: "ahmed@store.com",
      isActive: true,
      createdAt: new Date("2024-01-10"),
      updatedAt: new Date("2024-01-10"),
    },
    toStore: {
      id: "2",
      name: "Branch Store",
      location: "Bole Addis Ababa",
      responsibleUser: "Fatima Mohammed",
      phone: "+251-911-234567",
      email: "fatima@store.com",
      isActive: true,
      createdAt: new Date("2024-01-08"),
      updatedAt: new Date("2024-01-08"),
    },
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
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        quantity: 20,
        receivedQuantity: 20,
      },
    ],
    status: "received",
    transferDate: new Date("2024-01-15"),
    expectedDate: new Date("2024-01-16"),
    receivedDate: new Date("2024-01-16"),
    transferredBy: "Ahmed Hassan",
    receivedBy: "Fatima Mohammed",
    notes: "Regular stock replenishment",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-16"),
  },
];

let stockCounts: StockCount[] = [
  {
    id: "1",
    countNumber: "SC-001",
    storeId: "1",
    store: {
      id: "1",
      name: "Main Store",
      location: "Downtown Addis Ababa",
      responsibleUser: "Ahmed Hassan",
      phone: "+251-911-123456",
      email: "ahmed@store.com",
      isActive: true,
      createdAt: new Date("2024-01-10"),
      updatedAt: new Date("2024-01-10"),
    },
    countDate: new Date("2024-01-14"),
    status: "completed",
    countedBy: "Ahmed Hassan",
    approvedBy: "Manager",
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
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        systemQuantity: 50,
        countedQuantity: 48,
        variance: -2,
        notes: "2 kg shortage found",
      },
    ],
    notes: "Monthly stock count",
    createdAt: new Date("2024-01-14"),
    updatedAt: new Date("2024-01-14"),
  },
];

let nextTransferId = 2;
let nextCountId = 2;
let nextTransferNumber = 2;
let nextCountNumber = 2;

// Validation schemas
const createStockTransferSchema = z.object({
  fromStoreId: z.string().min(1),
  toStoreId: z.string().min(1),
  items: z.array(
    z.object({
      itemId: z.string().min(1),
      quantity: z.number().min(1),
    }),
  ),
  transferDate: z.string().transform((str) => new Date(str)),
  expectedDate: z
    .string()
    .optional()
    .transform((str) => (str ? new Date(str) : undefined)),
  transferredBy: z.string().min(1),
  notes: z.string().optional(),
});

const createStockCountSchema = z.object({
  storeId: z.string().min(1),
  countDate: z.string().transform((str) => new Date(str)),
  countedBy: z.string().min(1),
  items: z.array(
    z.object({
      itemId: z.string().min(1),
      systemQuantity: z.number().min(0),
      countedQuantity: z.number().min(0),
      notes: z.string().optional(),
    }),
  ),
  notes: z.string().optional(),
});

// GET /api/stock/transfers - List all stock transfers
stockRoutes.get("/transfers", (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(
      1,
      Math.min(100, parseInt(req.query.limit as string) || 10),
    );
    const status = req.query.status as string;

    let filteredTransfers = [...stockTransfers];

    if (status) {
      filteredTransfers = filteredTransfers.filter(
        (transfer) => transfer.status === status,
      );
    }

    const total = filteredTransfers.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedTransfers = filteredTransfers.slice(offset, offset + limit);

    const response: PaginatedResponse<StockTransfer> = {
      success: true,
      data: paginatedTransfers,
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
      error: "Failed to fetch stock transfers",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/stock/transfers - Create new stock transfer
stockRoutes.post("/transfers", (req, res) => {
  try {
    const validatedData = createStockTransferSchema.parse(req.body);

    const items = validatedData.items.map((item, index) => ({
      id: `${nextTransferId}-item-${index + 1}`,
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
        costPrice: 100,
        salesPrice: 150,
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
      receivedQuantity: 0,
    }));

    const newTransfer: StockTransfer = {
      id: nextTransferId.toString(),
      transferNumber: `TR-${nextTransferNumber.toString().padStart(3, "0")}`,
      fromStoreId: validatedData.fromStoreId,
      toStoreId: validatedData.toStoreId,
      fromStore: {
        // Mock store data
        id: validatedData.fromStoreId,
        name: "Sample From Store",
        location: "Sample Location",
        responsibleUser: "Sample User",
        phone: "+251-911-000000",
        email: "store@example.com",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      toStore: {
        // Mock store data
        id: validatedData.toStoreId,
        name: "Sample To Store",
        location: "Sample Location",
        responsibleUser: "Sample User",
        phone: "+251-911-000000",
        email: "store@example.com",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      items,
      status: "pending",
      transferDate: validatedData.transferDate,
      expectedDate: validatedData.expectedDate,
      transferredBy: validatedData.transferredBy,
      notes: validatedData.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    stockTransfers.push(newTransfer);
    nextTransferId++;
    nextTransferNumber++;

    const response: ApiResponse<StockTransfer> = {
      success: true,
      data: newTransfer,
      message: "Stock transfer created successfully",
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
      error: "Failed to create stock transfer",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/stock/counts - List all stock counts
stockRoutes.get("/counts", (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(
      1,
      Math.min(100, parseInt(req.query.limit as string) || 10),
    );
    const status = req.query.status as string;

    let filteredCounts = [...stockCounts];

    if (status) {
      filteredCounts = filteredCounts.filter(
        (count) => count.status === status,
      );
    }

    const total = filteredCounts.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedCounts = filteredCounts.slice(offset, offset + limit);

    const response: PaginatedResponse<StockCount> = {
      success: true,
      data: paginatedCounts,
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
      error: "Failed to fetch stock counts",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/stock/counts - Create new stock count
stockRoutes.post("/counts", (req, res) => {
  try {
    const validatedData = createStockCountSchema.parse(req.body);

    const items = validatedData.items.map((item, index) => ({
      id: `${nextCountId}-item-${index + 1}`,
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
        costPrice: 100,
        salesPrice: 150,
        taxRate: 15,
        reorderLevel: 15,
        currentStock: item.systemQuantity,
        valuationMethod: "FIFO" as const,
        variants: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      systemQuantity: item.systemQuantity,
      countedQuantity: item.countedQuantity,
      variance: item.countedQuantity - item.systemQuantity,
      notes: item.notes,
    }));

    const newCount: StockCount = {
      id: nextCountId.toString(),
      countNumber: `SC-${nextCountNumber.toString().padStart(3, "0")}`,
      storeId: validatedData.storeId,
      store: {
        // Mock store data
        id: validatedData.storeId,
        name: "Sample Store",
        location: "Sample Location",
        responsibleUser: "Sample User",
        phone: "+251-911-000000",
        email: "store@example.com",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      countDate: validatedData.countDate,
      status: "pending",
      countedBy: validatedData.countedBy,
      items,
      notes: validatedData.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    stockCounts.push(newCount);
    nextCountId++;
    nextCountNumber++;

    const response: ApiResponse<StockCount> = {
      success: true,
      data: newCount,
      message: "Stock count created successfully",
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
      error: "Failed to create stock count",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// PUT /api/stock/counts/:id/approve - Approve stock count
stockRoutes.put("/counts/:id/approve", (req, res) => {
  try {
    const countIndex = stockCounts.findIndex(
      (count) => count.id === req.params.id,
    );

    if (countIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Stock count not found",
      });
    }

    const { approvedBy } = req.body;

    stockCounts[countIndex].status = "approved";
    stockCounts[countIndex].approvedBy = approvedBy;
    stockCounts[countIndex].updatedAt = new Date();

    const response: ApiResponse<StockCount> = {
      success: true,
      data: stockCounts[countIndex],
      message: "Stock count approved successfully",
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to approve stock count",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
