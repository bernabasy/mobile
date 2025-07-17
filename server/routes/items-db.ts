import express from "express";
import { z } from "zod";
import { pool } from "../database/config";
import { Item, ItemVariant, ApiResponse } from "../../shared/api";

export const itemRoutes = express.Router();

// Validation schemas
const createItemSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
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
  variants: z.array(
    z.object({
      name: z.string().min(1),
      sku: z.string().min(1),
      costPrice: z.number().min(0),
      salesPrice: z.number().min(0),
      stock: z.number().min(0),
      barcode: z.string().optional(),
    })
  ).optional(),
});

const updateItemSchema = createItemSchema.partial();

// Helper function to convert database row to Item interface
const mapRowToItem = (row: any): Item => ({
  id: row.id.toString(),
  name: row.name,
  category: row.category,
  description: row.description || "",
  sku: row.sku,
  barcode: row.barcode,
  unit: row.unit,
  minStock: row.min_stock,
  maxStock: row.max_stock,
  costPrice: parseFloat(row.cost_price),
  salesPrice: parseFloat(row.sales_price),
  taxRate: parseFloat(row.tax_rate),
  reorderLevel: row.reorder_level,
  currentStock: row.current_stock,
  valuationMethod: row.valuation_method as "FIFO" | "LIFO" | "Average",
  variants: [],
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// GET /api/items - Get all items
itemRoutes.get("/", async (req, res) => {
  try {
    const { category, active = "true", search, page = 1, limit = 50 } = req.query;
    
    let query = `
      SELECT * FROM items 
      WHERE 1=1
    `;
    const values: any[] = [];
    let paramCount = 0;

    // Add filters
    if (category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      values.push(category);
    }

    if (active !== "all") {
      paramCount++;
      query += ` AND is_active = $${paramCount}`;
      values.push(active === "true");
    }

    if (search) {
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR sku ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      values.push(`%${search}%`);
    }

    // Add pagination
    const offset = (Number(page) - 1) * Number(limit);
    paramCount++;
    query += ` ORDER BY created_at DESC LIMIT $${paramCount}`;
    values.push(Number(limit));
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    values.push(offset);

    const result = await pool.query(query, values);
    const items = result.rows.map(mapRowToItem);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) FROM items 
      WHERE 1=1
    `;
    const countValues: any[] = [];
    let countParamCount = 0;

    if (category) {
      countParamCount++;
      countQuery += ` AND category = $${countParamCount}`;
      countValues.push(category);
    }

    if (active !== "all") {
      countParamCount++;
      countQuery += ` AND is_active = $${countParamCount}`;
      countValues.push(active === "true");
    }

    if (search) {
      countParamCount++;
      countQuery += ` AND (name ILIKE $${countParamCount} OR sku ILIKE $${countParamCount} OR description ILIKE $${countParamCount})`;
      countValues.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countValues);
    const total = parseInt(countResult.rows[0].count);

    const response: ApiResponse<{ items: Item[]; pagination: any }> = {
      success: true,
      data: {
        items,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch items",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/items/:id - Get item by ID
itemRoutes.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      "SELECT * FROM items WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Item not found",
      });
    }

    const item = mapRowToItem(result.rows[0]);

    // Get variants
    const variantsResult = await pool.query(
      "SELECT * FROM item_variants WHERE item_id = $1",
      [id]
    );

    item.variants = variantsResult.rows.map((row): ItemVariant => ({
      id: row.id.toString(),
      name: row.name,
      sku: row.sku,
      costPrice: parseFloat(row.cost_price),
      salesPrice: parseFloat(row.sales_price),
      stock: row.stock,
      barcode: row.barcode,
    }));

    const response: ApiResponse<Item> = {
      success: true,
      data: item,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching item:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch item",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/items - Create new item
itemRoutes.post("/", async (req, res) => {
  try {
    const validatedData = createItemSchema.parse(req.body);

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Insert item
      const itemResult = await client.query(
        `INSERT INTO items (
          name, category, description, sku, barcode, unit, min_stock, max_stock,
          cost_price, sales_price, tax_rate, reorder_level, current_stock, valuation_method
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          validatedData.name,
          validatedData.category,
          validatedData.description || "",
          validatedData.sku,
          validatedData.barcode || null,
          validatedData.unit,
          validatedData.minStock,
          validatedData.maxStock,
          validatedData.costPrice,
          validatedData.salesPrice,
          validatedData.taxRate,
          validatedData.reorderLevel,
          validatedData.currentStock,
          validatedData.valuationMethod,
        ]
      );

      const itemId = itemResult.rows[0].id;
      
      // Insert variants if provided
      if (validatedData.variants && validatedData.variants.length > 0) {
        for (const variant of validatedData.variants) {
          await client.query(
            `INSERT INTO item_variants (item_id, name, sku, cost_price, sales_price, stock, barcode)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              itemId,
              variant.name,
              variant.sku,
              variant.costPrice,
              variant.salesPrice,
              variant.stock,
              variant.barcode || null,
            ]
          );
        }
      }

      await client.query('COMMIT');

      const newItem = mapRowToItem(itemResult.rows[0]);

      const response: ApiResponse<Item> = {
        success: true,
        data: newItem,
        message: "Item created successfully",
      };

      res.status(201).json(response);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error creating item:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.errors,
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
itemRoutes.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateItemSchema.parse(req.body);

    // Check if item exists
    const existingResult = await pool.query(
      "SELECT id FROM items WHERE id = $1",
      [id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Item not found",
      });
    }

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 0;

    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined && key !== 'variants') {
        paramCount++;
        // Convert camelCase to snake_case for database columns
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        updateFields.push(`${dbKey} = $${paramCount}`);
        values.push(value);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No fields to update",
      });
    }

    paramCount++;
    values.push(id);

    const updateQuery = `
      UPDATE items 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(updateQuery, values);
    const updatedItem = mapRowToItem(result.rows[0]);

    const response: ApiResponse<Item> = {
      success: true,
      data: updatedItem,
      message: "Item updated successfully",
    };

    res.json(response);
  } catch (error) {
    console.error("Error updating item:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to update item",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// DELETE /api/items/:id - Delete item
itemRoutes.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM items WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Item not found",
      });
    }

    const response: ApiResponse<{ id: string }> = {
      success: true,
      data: { id },
      message: "Item deleted successfully",
    };

    res.json(response);
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete item",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/items/reports/low-stock - Get low stock items
itemRoutes.get("/reports/low-stock", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM items 
       WHERE current_stock <= reorder_level 
       AND is_active = true 
       ORDER BY (current_stock::float / NULLIF(reorder_level, 0)) ASC`
    );

    const items = result.rows.map(mapRowToItem);

    const response: ApiResponse<Item[]> = {
      success: true,
      data: items,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching low stock items:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch low stock items",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/items/meta/categories - Get item categories
itemRoutes.get("/meta/categories", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT DISTINCT category FROM items WHERE is_active = true ORDER BY category"
    );

    const categories = result.rows.map(row => row.category);

    const response: ApiResponse<string[]> = {
      success: true,
      data: categories,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch categories",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}); 