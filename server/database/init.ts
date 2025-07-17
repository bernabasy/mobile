import fs from 'fs';
import path from 'path';
import { pool } from './config';

export const initializeDatabase = async () => {
  try {
    console.log('🗄️ Initializing database...');
    
    // Read the schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the schema
    await pool.query(schema);
    
    console.log('✅ Database tables created successfully');
    console.log('✅ Sample data inserted');
    
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return false;
  }
};

// Run initialization if called directly
if (require.main === module) {
  initializeDatabase().then(() => {
    process.exit(0);
  });
} 