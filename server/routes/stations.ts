import express from "express";
import { z } from "zod";
import {
  Station,
  CreateStationRequest,
  ApiResponse,
  PaginatedResponse,
} from "../../shared/api";

export const stationRoutes = express.Router();

// In-memory storage for demonstration
let stations: Station[] = [
  {
    id: "1",
    name: "Main Counter",
    location: "Main Store - Downtown",
    responsibleUser: "Ahmed Hassan",
    openingBalance: 5000,
    totalSales: 12750,
    expectedCash: 17750,
    actualCash: 17500,
    variance: -250,
    status: "open",
    openedAt: new Date("2024-01-16T08:00:00Z"),
    createdAt: new Date("2024-01-16T08:00:00Z"),
    updatedAt: new Date("2024-01-16T15:30:00Z"),
  },
  {
    id: "2",
    name: "Branch Counter",
    location: "Branch Store - Bole",
    responsibleUser: "Fatima Mohammed",
    openingBalance: 3000,
    totalSales: 8500,
    expectedCash: 11500,
    actualCash: 11500,
    variance: 0,
    status: "closed",
    openedAt: new Date("2024-01-15T08:00:00Z"),
    closedAt: new Date("2024-01-15T18:00:00Z"),
    createdAt: new Date("2024-01-15T08:00:00Z"),
    updatedAt: new Date("2024-01-15T18:00:00Z"),
  },
  {
    id: "3",
    name: "Express Counter",
    location: "Main Store - Express Lane",
    responsibleUser: "Dawit Bekele",
    openingBalance: 2000,
    totalSales: 6200,
    expectedCash: 8200,
    actualCash: 8150,
    variance: -50,
    status: "reconciled",
    openedAt: new Date("2024-01-14T08:00:00Z"),
    closedAt: new Date("2024-01-14T18:00:00Z"),
    createdAt: new Date("2024-01-14T08:00:00Z"),
    updatedAt: new Date("2024-01-14T18:30:00Z"),
  },
];

let nextId = 4;

// Validation schemas
const createStationSchema = z.object({
  name: z.string().min(1).max(100),
  location: z.string().min(1).max(200),
  responsibleUser: z.string().min(1).max(100),
  openingBalance: z.number().min(0),
});

// GET /api/stations - List all stations
stationRoutes.get("/", (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(
      1,
      Math.min(100, parseInt(req.query.limit as string) || 10),
    );
    const status = req.query.status as string;
    const search = req.query.search as string;

    let filteredStations = [...stations];

    if (search) {
      const searchLower = search.toLowerCase();
      filteredStations = filteredStations.filter(
        (station) =>
          station.name.toLowerCase().includes(searchLower) ||
          station.location.toLowerCase().includes(searchLower) ||
          station.responsibleUser.toLowerCase().includes(searchLower),
      );
    }

    if (status) {
      filteredStations = filteredStations.filter(
        (station) => station.status === status,
      );
    }

    const total = filteredStations.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedStations = filteredStations.slice(offset, offset + limit);

    const response: PaginatedResponse<Station> = {
      success: true,
      data: paginatedStations,
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
      error: "Failed to fetch stations",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/stations/:id - Get specific station
stationRoutes.get("/:id", (req, res) => {
  try {
    const station = stations.find((station) => station.id === req.params.id);

    if (!station) {
      return res.status(404).json({
        success: false,
        error: "Station not found",
      });
    }

    const response: ApiResponse<Station> = {
      success: true,
      data: station,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch station",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// POST /api/stations - Create new station
stationRoutes.post("/", (req, res) => {
  try {
    const validatedData = createStationSchema.parse(req.body);

    const newStation: Station = {
      id: nextId.toString(),
      ...validatedData,
      totalSales: 0,
      expectedCash: validatedData.openingBalance,
      actualCash: 0,
      variance: 0,
      status: "open",
      openedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    stations.push(newStation);
    nextId++;

    const response: ApiResponse<Station> = {
      success: true,
      data: newStation,
      message: "Station created successfully",
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
      error: "Failed to create station",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// PUT /api/stations/:id/close - Close station
stationRoutes.put("/:id/close", (req, res) => {
  try {
    const stationIndex = stations.findIndex(
      (station) => station.id === req.params.id,
    );

    if (stationIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Station not found",
      });
    }

    const { actualCash, totalSales } = req.body;

    const station = stations[stationIndex];
    station.actualCash = actualCash;
    station.totalSales = totalSales || station.totalSales;
    station.expectedCash = station.openingBalance + station.totalSales;
    station.variance = station.actualCash - station.expectedCash;
    station.status = "closed";
    station.closedAt = new Date();
    station.updatedAt = new Date();

    const response: ApiResponse<Station> = {
      success: true,
      data: station,
      message: "Station closed successfully",
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to close station",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// PUT /api/stations/:id/reconcile - Reconcile station
stationRoutes.put("/:id/reconcile", (req, res) => {
  try {
    const stationIndex = stations.findIndex(
      (station) => station.id === req.params.id,
    );

    if (stationIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Station not found",
      });
    }

    const station = stations[stationIndex];

    if (station.status !== "closed") {
      return res.status(400).json({
        success: false,
        error: "Station must be closed before reconciliation",
      });
    }

    station.status = "reconciled";
    station.updatedAt = new Date();

    const response: ApiResponse<Station> = {
      success: true,
      data: station,
      message: "Station reconciled successfully",
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to reconcile station",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// PUT /api/stations/:id/sales - Update station sales
stationRoutes.put("/:id/sales", (req, res) => {
  try {
    const stationIndex = stations.findIndex(
      (station) => station.id === req.params.id,
    );

    if (stationIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Station not found",
      });
    }

    const { saleAmount } = req.body;

    const station = stations[stationIndex];
    station.totalSales += saleAmount;
    station.expectedCash = station.openingBalance + station.totalSales;
    station.variance = station.actualCash - station.expectedCash;
    station.updatedAt = new Date();

    const response: ApiResponse<Station> = {
      success: true,
      data: station,
      message: "Station sales updated successfully",
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to update station sales",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/stations/active - Get active stations
stationRoutes.get("/reports/active", (req, res) => {
  try {
    const activeStations = stations.filter(
      (station) => station.status === "open",
    );

    const response: ApiResponse<Station[]> = {
      success: true,
      data: activeStations,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch active stations",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// GET /api/stations/summary - Get stations summary
stationRoutes.get("/reports/summary", (req, res) => {
  try {
    const totalStations = stations.length;
    const openStations = stations.filter(
      (station) => station.status === "open",
    ).length;
    const closedStations = stations.filter(
      (station) => station.status === "closed",
    ).length;
    const reconciledStations = stations.filter(
      (station) => station.status === "reconciled",
    ).length;

    const totalSales = stations.reduce(
      (sum, station) => sum + station.totalSales,
      0,
    );
    const totalVariance = stations.reduce(
      (sum, station) => sum + station.variance,
      0,
    );

    const response: ApiResponse<any> = {
      success: true,
      data: {
        totalStations,
        openStations,
        closedStations,
        reconciledStations,
        totalSales,
        totalVariance,
      },
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch stations summary",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
