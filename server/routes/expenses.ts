import express from "express";
import { z } from "zod";
import {
  Expense,
  CreateExpenseRequest,
  ApiResponse,
  PaginatedResponse,
} from "../../shared/api";

export const expenseRoutes = express.Router();

// In-memory storage for demonstration
let expenses: Expense[] = [
  {
    id: "1",
    expenseNumber: "EXP-001",
    category: "Office Supplies",
    description: "Monthly stationery purchase",
    amount: 850,
    paymentMethod: "cash",
    expenseDate: new Date("2024-01-15"),
    status: "approved",
    approvedBy: "Manager",
    receipt: "receipt-001.pdf",
    notes: "Routine office supplies",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    expenseNumber: "EXP-002",
    category: "Transportation",
    description: "Fuel for delivery vehicle",
    amount: 1200,
    paymentMethod: "bank",
    expenseDate: new Date("2024-01-14"),
    status: "approved",
    approvedBy: "Manager",
    notes: "Weekly fuel expense",
    createdAt: new Date("2024-01-14"),
    updatedAt: new Date("2024-01-14"),
  },
  {
    id: "3",
    expenseNumber: "EXP-003",
    category: "Utilities",
    description: "Monthly electricity bill",
    amount: 2500,
    paymentMethod: "bank",
    expenseDate: new Date("2024-01-13"),
    status: "pending",
    notes: "January electricity bill",
    createdAt: new Date("2024-01-13"),
    updatedAt: new Date("2024-01-13"),
  },
];

let nextId = 4;
let nextExpenseNumber = 4;

// Validation schemas
const createExpenseSchema = z.object({
  category: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  amount: z.number().min(0),
  paymentMethod: z.enum(["cash", "bank", "check"]),
  expenseDate: z.string().transform((str) => new Date(str)),
  receipt: z.string().optional(),
  notes: z.string().optional(),
});

// GET /api/expenses - List all expenses
expenseRoutes.get("/", (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(
      1,
      Math.min(100, parseInt(req.query.limit as string) || 10),
    );
    const search = req.query.search as string;
    const category = req.query.category as string;
    const status = req.query.status as string;

    let filteredExpenses = [...expenses];

    if (search) {
      const searchLower = search.toLowerCase();
      filteredExpenses = filteredExpenses.filter(
        (expense) =>
          expense.description.toLowerCase().includes(searchLower) ||
          expense.category.toLowerCase().includes(searchLower) ||
          expense.expenseNumber.toLowerCase().includes(searchLower),
      );
    }

    if (category) {
      filteredExpenses = filteredExpenses.filter(
        (expense) => expense.category.toLowerCase() === category.toLowerCase(),
      );
    }

    if (status) {
      filteredExpenses = filteredExpenses.filter(
        (expense) => expense.status === status,
      );
    }

    const total = filteredExpenses.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedExpenses = filteredExpenses.slice(offset, offset + limit);

    const response: PaginatedResponse<Expense> = {
      success: true,
      data: paginatedExpenses,
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
      error: "Failed to fetch expenses",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/expenses/:id - Get specific expense
expenseRoutes.get("/:id", (req, res) => {
  try {
    const expense = expenses.find((expense) => expense.id === req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: "Expense not found",
      });
    }

    const response: ApiResponse<Expense> = {
      success: true,
      data: expense,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch expense",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/expenses - Create new expense
expenseRoutes.post("/", (req, res) => {
  try {
    const validatedData = createExpenseSchema.parse(req.body);

    const newExpense: Expense = {
      id: nextId.toString(),
      expenseNumber: `EXP-${nextExpenseNumber.toString().padStart(3, "0")}`,
      ...validatedData,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expenses.push(newExpense);
    nextId++;
    nextExpenseNumber++;

    const response: ApiResponse<Expense> = {
      success: true,
      data: newExpense,
      message: "Expense created successfully",
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
      error: "Failed to create expense",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// PUT /api/expenses/:id - Update expense
expenseRoutes.put("/:id", (req, res) => {
  try {
    const expenseIndex = expenses.findIndex(
      (expense) => expense.id === req.params.id,
    );

    if (expenseIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Expense not found",
      });
    }

    const validatedData = createExpenseSchema.partial().parse(req.body);

    const updatedExpense: Expense = {
      ...expenses[expenseIndex],
      ...validatedData,
      id: req.params.id,
      updatedAt: new Date(),
    };

    expenses[expenseIndex] = updatedExpense;

    const response: ApiResponse<Expense> = {
      success: true,
      data: updatedExpense,
      message: "Expense updated successfully",
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
      error: "Failed to update expense",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// PUT /api/expenses/:id/approve - Approve expense
expenseRoutes.put("/:id/approve", (req, res) => {
  try {
    const expenseIndex = expenses.findIndex(
      (expense) => expense.id === req.params.id,
    );

    if (expenseIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Expense not found",
      });
    }

    const { approvedBy } = req.body;

    expenses[expenseIndex].status = "approved";
    expenses[expenseIndex].approvedBy = approvedBy;
    expenses[expenseIndex].updatedAt = new Date();

    const response: ApiResponse<Expense> = {
      success: true,
      data: expenses[expenseIndex],
      message: "Expense approved successfully",
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to approve expense",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// PUT /api/expenses/:id/reject - Reject expense
expenseRoutes.put("/:id/reject", (req, res) => {
  try {
    const expenseIndex = expenses.findIndex(
      (expense) => expense.id === req.params.id,
    );

    if (expenseIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Expense not found",
      });
    }

    const { approvedBy } = req.body;

    expenses[expenseIndex].status = "rejected";
    expenses[expenseIndex].approvedBy = approvedBy;
    expenses[expenseIndex].updatedAt = new Date();

    const response: ApiResponse<Expense> = {
      success: true,
      data: expenses[expenseIndex],
      message: "Expense rejected successfully",
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to reject expense",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/expenses/categories - Get expense categories
expenseRoutes.get("/meta/categories", (req, res) => {
  try {
    const categories = [
      ...new Set(expenses.map((expense) => expense.category)),
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

// GET /api/expenses/reports/today - Get today's expenses
expenseRoutes.get("/reports/today", (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(expense.expenseDate);
      expenseDate.setHours(0, 0, 0, 0);
      return expenseDate.getTime() === today.getTime();
    });

    const totalExpenses = todayExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0,
    );
    const approvedExpenses = todayExpenses
      .filter((expense) => expense.status === "approved")
      .reduce((sum, expense) => sum + expense.amount, 0);
    const pendingExpenses = todayExpenses
      .filter((expense) => expense.status === "pending")
      .reduce((sum, expense) => sum + expense.amount, 0);

    const response: ApiResponse<any> = {
      success: true,
      data: {
        totalExpenses,
        approvedExpenses,
        pendingExpenses,
        expenseCount: todayExpenses.length,
        expenses: todayExpenses,
      },
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch today's expenses",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
