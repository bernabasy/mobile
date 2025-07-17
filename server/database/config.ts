import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables with debug
const result = dotenv.config({ debug: true });
console.log('Dotenv result:', result);
console.log('Environment variables loaded:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'stock_management',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || undefined, // Use undefined instead of empty string
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000, // Increased timeout
};

// Remove password if it's empty (better for peer auth)
if (!dbConfig.password) {
  delete dbConfig.password;
}

console.log('Database config (password hidden):', {
  ...dbConfig,
  password: dbConfig.password ? '***' : 'undefined'
});

// Create connection pool
export const pool = new Pool(dbConfig);

// Test database connection
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

// Graceful shutdown
process.on('SIGINT', () => {
  pool.end(() => {
    console.log('Database pool has ended');
    process.exit(0);
  });
});

export default pool; 