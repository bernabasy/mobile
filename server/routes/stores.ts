import express from "express";
import { z } from "zod";
import { Store, ApiResponse, PaginatedResponse } from "../../shared/api";

export const storeRoutes = express.Router();

// In-memory storage for demonstration
let stores: Store[] = [
  {
    id: "1",
    name: "Main Warehouse",
    location: "Bole Road",
    responsibleUser: "Abebe Kebede",
    phone: "+251-911-123456",
    email: "warehouse@example.com",
    isActive: true,
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10"),
  },
  {
    id: "2",
    name: "Downtown Store",
    location: "Piazza",
    responsibleUser: "Sara Haile",
    phone: "+251-911-234567",
    email: "downtown@example.com",
    isActive: true,
    createdAt: new Date("2024-01-12"),
    updatedAt: new Date("2024-01-12"),
  },
];

let nextId = 4;

// Validation schemas
const createStoreSchema = z.object({
  name: z.string().min(1).max(100),
  location: z.string().min(1).max(200),
  responsibleUser: z.string().min(1).max(100),
  phone: z.string().min(10).max(20),
  email: z.string().email(),
});

// GET /api/stores - List all stores
storeRoutes.get("/", (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(
      1,
      Math.min(100, parseInt(req.query.limit as string) || 20),
    );
    const search = req.query.search as string;

    let filteredStores = stores.filter((store) => store.isActive);

    if (search) {
      const searchLower = search.toLowerCase();
      filteredStores = filteredStores.filter(
        (store) =>
          store.name.toLowerCase().includes(searchLower) ||
          store.location.toLowerCase().includes(searchLower) ||
          store.responsibleUser.toLowerCase().includes(searchLower),
      );
    }

    const total = filteredStores.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedStores = filteredStores.slice(offset, offset + limit);

    const response: PaginatedResponse<Store> = {
      success: true,
      data: paginatedStores,
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
      error: "Failed to fetch stores",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/stores/:id - Get specific store
storeRoutes.get("/:id", (req, res) => {
  try {
    const store = stores.find(
      (store) => store.id === req.params.id && store.isActive,
    );

    if (!store) {
      return res.status(404).json({
        success: false,
        error: "Store not found",
      });
    }

    const response: ApiResponse<Store> = {
      success: true,
      data: store,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch store",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/stores - Create new store
storeRoutes.post("/", (req, res) => {
  try {
    const validatedData = createStoreSchema.parse(req.body);

    // Check if email already exists
    const existingEmail = stores.find(
      (store) =>
        store.email.toLowerCase() === validatedData.email.toLowerCase() &&
        store.isActive,
    );

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        error: "Email already exists",
      });
    }

    const newStore: Store = {
      id: nextId.toString(),
      ...validatedData,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    stores.push(newStore);
    nextId++;

    const response: ApiResponse<Store> = {
      success: true,
      data: newStore,
      message: "Store created successfully",
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
      error: "Failed to create store",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// PUT /api/stores/:id - Update store
storeRoutes.put("/:id", (req, res) => {
  try {
    const storeIndex = stores.findIndex(
      (store) => store.id === req.params.id && store.isActive,
    );

    if (storeIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Store not found",
      });
    }

    const validatedData = createStoreSchema.partial().parse(req.body);

    const updatedStore: Store = {
      ...stores[storeIndex],
      ...validatedData,
      id: req.params.id,
      updatedAt: new Date(),
    };

    stores[storeIndex] = updatedStore;

    const response: ApiResponse<Store> = {
      success: true,
      data: updatedStore,
      message: "Store updated successfully",
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
      error: "Failed to update store",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// DELETE /api/stores/:id - Soft delete store
storeRoutes.delete("/:id", (req, res) => {
  try {
    const storeIndex = stores.findIndex(
      (store) => store.id === req.params.id && store.isActive,
    );

    if (storeIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Store not found",
      });
    }

    stores[storeIndex].isActive = false;
    stores[storeIndex].updatedAt = new Date();

    res.json({
      success: true,
      message: "Store deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to delete store",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
