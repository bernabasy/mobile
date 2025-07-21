import { query } from './connection';
import { hashPin } from '@/utils/helpers';

export const seedDatabase = async (): Promise<void> => {
  try {
    console.log('🌱 Seeding database...');

    // Create default categories
    await query(`
      INSERT INTO categories (name, description) VALUES
      ('Beverages', 'Coffee, tea, and other drinks'),
      ('Food', 'Food items and ingredients'),
      ('Spices', 'Spices and seasonings'),
      ('Grains', 'Rice, wheat, and other grains'),
      ('Oils', 'Cooking oils and fats')
      ON CONFLICT (name) DO NOTHING
    `);

    // Create a default admin user
    const hashedPin = await hashPin('123456');
    await query(`
      INSERT INTO users (firstname, lastname, mobile, pin, is_verified, is_active)
      VALUES ('Admin', 'User', '911111111', $1, true, true)
      ON CONFLICT (mobile) DO NOTHING
    `, [hashedPin]);

    // Get user ID for foreign key references
    const userResult = await query('SELECT id FROM users WHERE mobile = $1', ['911111111']);
    const userId = userResult.rows[0]?.id;

    if (userId) {
      // Get category IDs
      const categoriesResult = await query('SELECT id, name FROM categories');
      const categories = categoriesResult.rows.reduce((acc: any, row: any) => {
        acc[row.name] = row.id;
        return acc;
      }, {});

      // Create sample items
      await query(`
        INSERT INTO items (
          name, category_id, description, sku, unit, min_stock, max_stock,
          reorder_level, current_stock, cost_price, selling_price, tax_rate, created_by
        ) VALUES
        ('Ethiopian Coffee Beans Premium', $1, 'High-quality Arabica coffee beans from Ethiopian highlands', 'COF-001', 'kg', 10, 100, 15, 45, 850.00, 1200.00, 15, $6),
        ('Pure Ethiopian Honey', $2, 'Natural honey from Ethiopian beekeepers', 'HON-001', 'bottle', 20, 200, 25, 8, 450.00, 650.00, 15, $6),
        ('Traditional Injera Mix', $2, 'Traditional Ethiopian injera flour mix', 'INJ-001', 'kg', 30, 300, 40, 125, 180.00, 250.00, 15, $6),
        ('Berbere Spice Mix', $3, 'Traditional Ethiopian spice blend', 'BER-001', 'kg', 15, 150, 20, 12, 320.00, 480.00, 15, $6),
        ('Teff Grain', $4, 'Premium teff grain for injera making', 'TEF-001', 'kg', 25, 250, 30, 85, 280.00, 420.00, 15, $6),
        ('Sunflower Oil', $5, 'Pure sunflower cooking oil', 'OIL-001', 'liter', 50, 500, 60, 150, 180.00, 250.00, 15, $6)
        ON CONFLICT (sku) DO NOTHING
      `, [categories['Beverages'], categories['Food'], categories['Food'], categories['Spices'], categories['Grains'], categories['Oils'], userId]);

      // Create sample suppliers
      await query(`
        INSERT INTO suppliers (
          name, contact_person, email, phone, address, city, country,
          tax_id, payment_terms, credit_limit, created_by
        ) VALUES
        ('Ethiopian Coffee Exporters', 'Ahmed Hassan', 'contact@ethcoffee.com', '+251-11-123-4567', 'Bole Road 123', 'Addis Ababa', 'Ethiopia', 'ETH-001234567', 'Net 30', 50000, $1),
        ('Habesha Honey Suppliers', 'Fatima Mohammed', 'info@habeshahoney.et', '+251-11-234-5678', 'Kazanchis District', 'Addis Ababa', 'Ethiopia', 'ETH-001234568', 'Net 15', 25000, $1),
        ('Teff & Grains Co.', 'Dawit Bekele', 'sales@teffgrains.et', '+251-11-345-6789', 'Merkato Area', 'Addis Ababa', 'Ethiopia', 'ETH-001234569', 'COD', 15000, $1)
        ON CONFLICT (email) DO NOTHING
      `, [userId]);

      // Create sample customers
      await query(`
        INSERT INTO customers (
          name, contact_person, email, phone, address, city, country,
          tax_id, payment_terms, credit_limit, created_by
        ) VALUES
        ('Meron Coffee Shop', 'Meron Tadesse', 'meron@coffeeshop.et', '+251-911-123456', 'Bole Road 456', 'Addis Ababa', 'Ethiopia', 'ETH-C001234567', 'Net 15', 15000, $1),
        ('Habesha Restaurant', 'Sara Haile', 'info@habesharestaurant.et', '+251-911-234567', 'Kazanchis District', 'Addis Ababa', 'Ethiopia', 'ETH-C001234568', 'Net 30', 25000, $1),
        ('Retail Store ABC', 'Mohammed Ali', 'mohammed@retailabc.et', '+251-911-345678', 'Piazza Area', 'Addis Ababa', 'Ethiopia', 'ETH-C001234569', 'COD', 5000, $1)
        ON CONFLICT (email) DO NOTHING
      `, [userId]);
    }

    console.log('✅ Database seeded successfully');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
};

// Run seeding if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}