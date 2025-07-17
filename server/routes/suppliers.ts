import express from "express";
import { z } from "zod";
import {
  Supplier,
  CreateSupplierRequest,
  ApiResponse,
  PaginatedResponse,
} from "../../shared/api";

export const supplierRoutes = express.Router();

// In-memory storage for demonstration
let suppliers: Supplier[] = [
  {
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
  {
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
  {
    id: "3",
    name: "Teff & Grains Co.",
    email: "sales@teffgrains.et",
    phone: "+251-11-345-6789",
    address: "Merkato Area",
    city: "Addis Ababa",
    country: "Ethiopia",
    taxId: "ETH-001234569",
    paymentTerms: "COD",
    creditLimit: 15000,
    currentBalance: 0,
    totalPurchases: 28000,
    isActive: true,
    createdAt: new Date("2024-01-08"),
    updatedAt: new Date("2024-01-08"),
  },
];

let nextId = 4;

// Validation schemas
const createSupplierSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  address: z.string().min(1).max(200),
  city: z.string().min(1).max(50),
  country: z.string().min(1).max(50),
  taxId: z.string().min(1).max(50),
  paymentTerms: z.string().min(1).max(50),
  creditLimit: z.number().min(0),
});

// GET /api/suppliers - List all suppliers
supplierRoutes.get("/", (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(
      1,
      Math.min(100, parseInt(req.query.limit as string) || 10),
    );
    const search = req.query.search as string;

    let filteredSuppliers = suppliers.filter((supplier) => supplier.isActive);

    if (search) {
      const searchLower = search.toLowerCase();
      filteredSuppliers = filteredSuppliers.filter(
        (supplier) =>
          supplier.name.toLowerCase().includes(searchLower) ||
          supplier.email.toLowerCase().includes(searchLower) ||
          supplier.phone.includes(search),
      );
    }

    const total = filteredSuppliers.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedSuppliers = filteredSuppliers.slice(offset, offset + limit);

    const response: PaginatedResponse<Supplier> = {
      success: true,
      data: paginatedSuppliers,
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
      error: "Failed to fetch suppliers",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/suppliers/:id - Get specific supplier
supplierRoutes.get("/:id", (req, res) => {
  try {
    const supplier = suppliers.find(
      (supplier) => supplier.id === req.params.id && supplier.isActive,
    );

    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: "Supplier not found",
      });
    }

    const response: ApiResponse<Supplier> = {
      success: true,
      data: supplier,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch supplier",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/suppliers - Create new supplier
supplierRoutes.post("/", (req, res) => {
  try {
    const validatedData = createSupplierSchema.parse(req.body);

    // Check if email already exists
    const existingEmail = suppliers.find(
      (supplier) =>
        supplier.email.toLowerCase() === validatedData.email.toLowerCase() &&
        supplier.isActive,
    );

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        error: "Email already exists",
      });
    }

    const newSupplier: Supplier = {
      id: nextId.toString(),
      ...validatedData,
      currentBalance: 0,
      totalPurchases: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    suppliers.push(newSupplier);
    nextId++;

    const response: ApiResponse<Supplier> = {
      success: true,
      data: newSupplier,
      message: "Supplier created successfully",
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
      error: "Failed to create supplier",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// PUT /api/suppliers/:id - Update supplier
supplierRoutes.put("/:id", (req, res) => {
  try {
    const supplierIndex = suppliers.findIndex(
      (supplier) => supplier.id === req.params.id && supplier.isActive,
    );

    if (supplierIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Supplier not found",
      });
    }

    const validatedData = createSupplierSchema.partial().parse(req.body);

    const updatedSupplier: Supplier = {
      ...suppliers[supplierIndex],
      ...validatedData,
      id: req.params.id,
      updatedAt: new Date(),
    };

    suppliers[supplierIndex] = updatedSupplier;

    const response: ApiResponse<Supplier> = {
      success: true,
      data: updatedSupplier,
      message: "Supplier updated successfully",
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
      error: "Failed to update supplier",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// DELETE /api/suppliers/:id - Soft delete supplier
supplierRoutes.delete("/:id", (req, res) => {
  try {
    const supplierIndex = suppliers.findIndex(
      (supplier) => supplier.id === req.params.id && supplier.isActive,
    );

    if (supplierIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Supplier not found",
      });
    }

    suppliers[supplierIndex].isActive = false;
    suppliers[supplierIndex].updatedAt = new Date();

    res.json({
      success: true,
      message: "Supplier deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to delete supplier",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/suppliers/:id/transactions - Get supplier transaction history
supplierRoutes.get("/:id/transactions", (req, res) => {
  try {
    const supplier = suppliers.find(
      (supplier) => supplier.id === req.params.id && supplier.isActive,
    );

    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: "Supplier not found",
      });
    }

    // Mock transaction data
    const transactions = [
      {
        id: "1",
        type: "purchase" as const,
        date: new Date("2024-01-15"),
        amount: 5000,
        description: "Coffee beans purchase",
        status: "completed" as const,
      },
      {
        id: "2",
        type: "payment" as const,
        date: new Date("2024-01-10"),
        amount: -2500,
        description: "Payment for previous order",
        status: "completed" as const,
      },
      {
        id: "3",
        type: "purchase" as const,
        date: new Date("2024-01-08"),
        amount: 3750,
        description: "Honey purchase",
        status: "pending" as const,
      },
    ];

    const response: ApiResponse<typeof transactions> = {
      success: true,
      data: transactions,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch transactions",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
