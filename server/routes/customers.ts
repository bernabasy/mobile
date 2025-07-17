import express from "express";
import { z } from "zod";
import {
  Customer,
  CreateCustomerRequest,
  ApiResponse,
  PaginatedResponse,
} from "../../shared/api";

export const customerRoutes = express.Router();

// In-memory storage for demonstration
let customers: Customer[] = [
  {
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
  {
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
  {
    id: "3",
    name: "Dawit Bekele",
    email: "dawit@email.com",
    phone: "+251-911-345678",
    address: "Piazza Area",
    city: "Addis Ababa",
    country: "Ethiopia",
    paymentTerms: "COD",
    creditLimit: 5000,
    currentBalance: 1500,
    totalSales: 12000,
    isActive: true,
    createdAt: new Date("2024-01-12"),
    updatedAt: new Date("2024-01-12"),
  },
];

let nextId = 4;

// Validation schemas
const createCustomerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  address: z.string().min(1).max(200),
  city: z.string().min(1).max(50),
  country: z.string().min(1).max(50),
  taxId: z.string().optional(),
  paymentTerms: z.string().min(1).max(50),
  creditLimit: z.number().min(0),
});

// GET /api/customers - List all customers
customerRoutes.get("/", (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(
      1,
      Math.min(100, parseInt(req.query.limit as string) || 10),
    );
    const search = req.query.search as string;

    let filteredCustomers = customers.filter((customer) => customer.isActive);

    if (search) {
      const searchLower = search.toLowerCase();
      filteredCustomers = filteredCustomers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchLower) ||
          customer.email.toLowerCase().includes(searchLower) ||
          customer.phone.includes(search),
      );
    }

    const total = filteredCustomers.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedCustomers = filteredCustomers.slice(offset, offset + limit);

    const response: PaginatedResponse<Customer> = {
      success: true,
      data: paginatedCustomers,
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
      error: "Failed to fetch customers",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/customers/:id - Get specific customer
customerRoutes.get("/:id", (req, res) => {
  try {
    const customer = customers.find(
      (customer) => customer.id === req.params.id && customer.isActive,
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    const response: ApiResponse<Customer> = {
      success: true,
      data: customer,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch customer",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/customers - Create new customer
customerRoutes.post("/", (req, res) => {
  try {
    const validatedData = createCustomerSchema.parse(req.body);

    // Check if email already exists
    const existingEmail = customers.find(
      (customer) =>
        customer.email.toLowerCase() === validatedData.email.toLowerCase() &&
        customer.isActive,
    );

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        error: "Email already exists",
      });
    }

    const newCustomer: Customer = {
      id: nextId.toString(),
      ...validatedData,
      currentBalance: 0,
      totalSales: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    customers.push(newCustomer);
    nextId++;

    const response: ApiResponse<Customer> = {
      success: true,
      data: newCustomer,
      message: "Customer created successfully",
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
      error: "Failed to create customer",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// PUT /api/customers/:id - Update customer
customerRoutes.put("/:id", (req, res) => {
  try {
    const customerIndex = customers.findIndex(
      (customer) => customer.id === req.params.id && customer.isActive,
    );

    if (customerIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    const validatedData = createCustomerSchema.partial().parse(req.body);

    const updatedCustomer: Customer = {
      ...customers[customerIndex],
      ...validatedData,
      id: req.params.id,
      updatedAt: new Date(),
    };

    customers[customerIndex] = updatedCustomer;

    const response: ApiResponse<Customer> = {
      success: true,
      data: updatedCustomer,
      message: "Customer updated successfully",
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
      error: "Failed to update customer",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// DELETE /api/customers/:id - Soft delete customer
customerRoutes.delete("/:id", (req, res) => {
  try {
    const customerIndex = customers.findIndex(
      (customer) => customer.id === req.params.id && customer.isActive,
    );

    if (customerIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    customers[customerIndex].isActive = false;
    customers[customerIndex].updatedAt = new Date();

    res.json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to delete customer",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/customers/:id/transactions - Get customer transaction history
customerRoutes.get("/:id/transactions", (req, res) => {
  try {
    const customer = customers.find(
      (customer) => customer.id === req.params.id && customer.isActive,
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    // Mock transaction data
    const transactions = [
      {
        id: "1",
        type: "sale" as const,
        date: new Date("2024-01-15"),
        amount: 2500,
        description: "Coffee and honey purchase",
        status: "completed" as const,
      },
      {
        id: "2",
        type: "payment" as const,
        date: new Date("2024-01-12"),
        amount: -1000,
        description: "Payment received",
        status: "completed" as const,
      },
      {
        id: "3",
        type: "sale" as const,
        date: new Date("2024-01-10"),
        amount: 1800,
        description: "Monthly order",
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
