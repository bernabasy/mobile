import fs from 'fs';
import path from 'path';
import { query } from './connection';

export const runMigrations = async (): Promise<void> => {
  try {
    console.log('🗄️ Running database migrations...');
    
    // Read the schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the schema
    await query(schema);
    
    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    throw error;
  }
};

// Run migrations if called directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}