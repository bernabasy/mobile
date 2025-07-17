import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { testConnection } from "./database/config";
import { handleDemo } from "./routes/demo";
import { itemRoutes } from "./routes/items";
import { supplierRoutes } from "./routes/suppliers";
import { customerRoutes } from "./routes/customers";
import { purchaseRoutes } from "./routes/purchases";
import { saleRoutes } from "./routes/sales";
import { stockRoutes } from "./routes/stock";
import { storeRoutes } from "./routes/stores";
import { expenseRoutes } from "./routes/expenses";
import { stationRoutes } from "./routes/stations";
import { dashboardRoutes } from "./routes/dashboard";

// Load environment variables
dotenv.config();

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Test database connection on startup
  testConnection().then((connected) => {
    if (connected) {
      console.log("🗄️ Database ready for queries");
    } else {
      console.log("⚠️ Application running without database connection");
    }
  });

  // Health check
  app.get("/api/ping", (_req, res) => {
    res.json({
      message: "Stock Management Server Online!",
      timestamp: new Date().toISOString(),
      currency: "Birr",
      database: "PostgreSQL",
    });
  });

  // Demo route
  app.get("/api/demo", handleDemo);

  // API Routes
  app.use("/api/items", itemRoutes);
  app.use("/api/suppliers", supplierRoutes);
  app.use("/api/customers", customerRoutes);
  app.use("/api/purchases", purchaseRoutes);
  app.use("/api/sales", saleRoutes);
  app.use("/api/stock", stockRoutes);
  app.use("/api/stores", storeRoutes);
  app.use("/api/expenses", expenseRoutes);
  app.use("/api/stations", stationRoutes);
  app.use("/api/dashboard", dashboardRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: "Endpoint not found",
      path: req.path,
      method: req.method,
    });
  });

  // Error handler
  app.use(
    (
      err: any,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      console.error("Server Error:", err);
      res.status(500).json({
        error: "Internal server error",
        message: err.message,
      });
    },
  );

  return app;
}
