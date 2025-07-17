import express from "express";
import { z } from "zod";
import {
  Item,
  CreateItemRequest,
  UpdateItemRequest,
  ApiResponse,
  PaginatedResponse,
  ItemVariant,
} from "../../shared/api";

export const itemRoutes = express.Router();

// In-memory storage for demonstration
// In production, this would be a database
let items: Item[] = [
  {
    id: "1",
    name: "Coffee Beans Premium",
    category: "Beverages",
    description: "High-quality Arabica coffee beans from Ethiopian highlands",
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
    variants: [
      {
        id: "v1",
        name: "Light Roast",
        sku: "COF-001-L",
        costPrice: 850,
        salesPrice: 1200,
        stock: 25,
      },
      {
        id: "v2",
        name: "Dark Roast",
        sku: "COF-001-D",
        costPrice: 870,
        salesPrice: 1250,
        stock: 20,
      },
    ],
    isActive: true,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
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
    currentStock: 8, // Low stock for testing
    valuationMethod: "FIFO",
    variants: [],
    isActive: true,
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10"),
  },
  {
    id: "3",
    name: "Traditional Injera Mix",
    category: "Food",
    description: "Traditional Ethiopian injera flour mix",
    sku: "INJ-001",
    unit: "kg",
    minStock: 30,
    maxStock: 300,
    costPrice: 180,
    salesPrice: 250,
    taxRate: 15,
    reorderLevel: 40,
    currentStock: 125,
    valuationMethod: "FIFO",
    variants: [],
    isActive: true,
    createdAt: new Date("2024-01-12"),
    updatedAt: new Date("2024-01-12"),
  },
];

let nextId = 4;

// Validation schemas
const createItemSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().min(1).max(50),
  description: z.string().max(500),
  sku: z.string().min(1).max(50),
  barcode: z.string().optional(),
  unit: z.string().min(1).max(20),
  minStock: z.number().min(0),
  maxStock: z.number().min(0),
  costPrice: z.number().min(0),
  salesPrice: z.number().min(0),
  taxRate: z.number().min(0).max(100),
  reorderLevel: z.number().min(0),
  currentStock: z.number().min(0),
  valuationMethod: z.enum(["FIFO", "LIFO", "Average"]),
  variants: z
    .array(
      z.object({
        name: z.string().min(1),
        sku: z.string().min(1),
        costPrice: z.number().min(0),
        salesPrice: z.number().min(0),
        stock: z.number().min(0),
      }),
    )
    .optional(),
});

// GET /api/items - List all items with pagination and filtering
itemRoutes.get("/", (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(
      1,
      Math.min(100, parseInt(req.query.limit as string) || 10),
    );
    const search = req.query.search as string;
    const category = req.query.category as string;
    const lowStock = req.query.lowStock === "true";

    let filteredItems = items.filter((item) => item.isActive);

    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      filteredItems = filteredItems.filter(
        (item) =>
          item.name.toLowerCase().includes(searchLower) ||
          item.sku.toLowerCase().includes(searchLower) ||
          item.description.toLowerCase().includes(searchLower),
      );
    }

    if (category) {
      filteredItems = filteredItems.filter(
        (item) => item.category.toLowerCase() === category.toLowerCase(),
      );
    }

    if (lowStock) {
      filteredItems = filteredItems.filter(
        (item) => item.currentStock <= item.reorderLevel,
      );
    }

    // Pagination
    const total = filteredItems.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedItems = filteredItems.slice(offset, offset + limit);

    const response: PaginatedResponse<Item> = {
      success: true,
      data: paginatedItems,
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
      error: "Failed to fetch items",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/items/:id - Get specific item
itemRoutes.get("/:id", (req, res) => {
  try {
    const item = items.find(
      (item) => item.id === req.params.id && item.isActive,
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        error: "Item not found",
      });
    }

    const response: ApiResponse<Item> = {
      success: true,
      data: item,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch item",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/items - Create new item
itemRoutes.post("/", (req, res) => {
  try {
    const validatedData = createItemSchema.parse(req.body);

    // Check if SKU already exists
    const existingSku = items.find(
      (item) =>
        item.sku.toLowerCase() === validatedData.sku.toLowerCase() &&
        item.isActive,
    );

    if (existingSku) {
      return res.status(400).json({
        success: false,
        error: "SKU already exists",
      });
    }

    const newItem: Item = {
      id: nextId.toString(),
      ...validatedData,
      variants:
        validatedData.variants?.map((variant, index) => ({
          ...variant,
          id: `${nextId}-v${index + 1}`,
        })) || [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    items.push(newItem);
    nextId++;

    const response: ApiResponse<Item> = {
      success: true,
      data: newItem,
      message: "Item created successfully",
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
      error: "Failed to create item",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// PUT /api/items/:id - Update item
itemRoutes.put("/:id", (req, res) => {
  try {
    const itemIndex = items.findIndex(
      (item) => item.id === req.params.id && item.isActive,
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Item not found",
      });
    }

    const validatedData = createItemSchema.partial().parse(req.body);

    const updatedItem: Item = {
      ...items[itemIndex],
      ...validatedData,
      id: req.params.id,
      updatedAt: new Date(),
    };

    items[itemIndex] = updatedItem;

    const response: ApiResponse<Item> = {
      success: true,
      data: updatedItem,
      message: "Item updated successfully",
    };

    res.json(response);
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
      error: "Failed to update item",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// DELETE /api/items/:id - Soft delete item
itemRoutes.delete("/:id", (req, res) => {
  try {
    const itemIndex = items.findIndex(
      (item) => item.id === req.params.id && item.isActive,
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Item not found",
      });
    }

    items[itemIndex].isActive = false;
    items[itemIndex].updatedAt = new Date();

    res.json({
      success: true,
      message: "Item deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to delete item",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/items/low-stock - Get low stock items
itemRoutes.get("/reports/low-stock", (req, res) => {
  try {
    const lowStockItems = items
      .filter((item) => item.isActive && item.currentStock <= item.reorderLevel)
      .map((item) => ({
        ...item,
        status:
          item.currentStock === 0
            ? ("critical" as const)
            : item.currentStock < item.minStock
              ? ("low" as const)
              : ("reorder" as const),
        daysWithoutSales: Math.floor(Math.random() * 30), // Mock data
        suggestedOrderQuantity: Math.max(
          item.maxStock - item.currentStock,
          item.minStock,
        ),
        currentStockValue: item.currentStock * item.costPrice,
      }));

    const response: ApiResponse<typeof lowStockItems> = {
      success: true,
      data: lowStockItems,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch low stock items",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/items/categories - Get all categories
itemRoutes.get("/meta/categories", (req, res) => {
  try {
    const categories = [
      ...new Set(
        items.filter((item) => item.isActive).map((item) => item.category),
      ),
    ];

    const response: ApiResponse<string[]> = {
      success: true,
      data: categories,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch categories",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
