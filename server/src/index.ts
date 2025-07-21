import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

import { errorHandler } from '@/middleware/errorHandler';
import { notFoundHandler } from '@/middleware/notFoundHandler';
import { authMiddleware } from '@/middleware/auth';
import { validateRequest } from '@/middleware/validation';
import { connectDatabase } from '@/database/connection';

// Import routes
import authRoutes from '@/routes/auth';
import userRoutes from '@/routes/users';
import itemRoutes from '@/routes/items';
import supplierRoutes from '@/routes/suppliers';
import customerRoutes from '@/routes/customers';
import purchaseRoutes from '@/routes/purchases';
import saleRoutes from '@/routes/sales';
import inventoryRoutes from '@/routes/inventory';
import reportRoutes from '@/routes/reports';
import dashboardRoutes from '@/routes/dashboard';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_PREFIX = process.env.API_PREFIX || '/api';

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// API routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, authMiddleware, userRoutes);
app.use(`${API_PREFIX}/items`, authMiddleware, itemRoutes);
app.use(`${API_PREFIX}/suppliers`, authMiddleware, supplierRoutes);
app.use(`${API_PREFIX}/customers`, authMiddleware, customerRoutes);
app.use(`${API_PREFIX}/purchases`, authMiddleware, purchaseRoutes);
app.use(`${API_PREFIX}/sales`, authMiddleware, saleRoutes);
app.use(`${API_PREFIX}/inventory`, authMiddleware, inventoryRoutes);
app.use(`${API_PREFIX}/reports`, authMiddleware, reportRoutes);
app.use(`${API_PREFIX}/dashboard`, authMiddleware, dashboardRoutes);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Database connection and server startup
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();
    console.log('✅ Database connected successfully');

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 API available at http://localhost:${PORT}${API_PREFIX}`);
      console.log(`🏥 Health check at http://localhost:${PORT}/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer();

export default app;