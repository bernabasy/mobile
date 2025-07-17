-- Stock Management Database Schema

-- Items table
CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    sku VARCHAR(50) UNIQUE NOT NULL,
    barcode VARCHAR(100),
    unit VARCHAR(20) NOT NULL,
    min_stock INTEGER DEFAULT 0,
    max_stock INTEGER DEFAULT 0,
    cost_price DECIMAL(10,2) NOT NULL,
    sales_price DECIMAL(10,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    reorder_level INTEGER DEFAULT 0,
    current_stock INTEGER DEFAULT 0,
    valuation_method VARCHAR(10) DEFAULT 'FIFO' CHECK (valuation_method IN ('FIFO', 'LIFO', 'Average')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Item variants table
CREATE TABLE IF NOT EXISTS item_variants (
    id SERIAL PRIMARY KEY,
    item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    sku VARCHAR(50) UNIQUE NOT NULL,
    cost_price DECIMAL(10,2) NOT NULL,
    sales_price DECIMAL(10,2) NOT NULL,
    stock INTEGER DEFAULT 0,
    barcode VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stores table
CREATE TABLE IF NOT EXISTS stores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(200) NOT NULL,
    responsible_user VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    payment_terms VARCHAR(50),
    credit_limit DECIMAL(12,2) DEFAULT 0,
    current_balance DECIMAL(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    credit_limit DECIMAL(12,2) DEFAULT 0,
    current_balance DECIMAL(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchases table
CREATE TABLE IF NOT EXISTS purchases (
    id SERIAL PRIMARY KEY,
    purchase_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id INTEGER REFERENCES suppliers(id),
    purchase_date DATE NOT NULL,
    expected_date DATE,
    received_date DATE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'partial', 'cancelled')),
    subtotal DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    paid_amount DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchase items table
CREATE TABLE IF NOT EXISTS purchase_items (
    id SERIAL PRIMARY KEY,
    purchase_id INTEGER REFERENCES purchases(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES items(id),
    quantity INTEGER NOT NULL,
    received_quantity INTEGER DEFAULT 0,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL
);

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    sale_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER REFERENCES customers(id),
    sale_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'refunded', 'cancelled')),
    subtotal DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    paid_amount DECIMAL(12,2) DEFAULT 0,
    payment_method VARCHAR(20) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank', 'check', 'credit')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sale items table
CREATE TABLE IF NOT EXISTS sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES items(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL
);

-- Stock transfers table
CREATE TABLE IF NOT EXISTS stock_transfers (
    id SERIAL PRIMARY KEY,
    transfer_number VARCHAR(50) UNIQUE NOT NULL,
    from_store_id INTEGER REFERENCES stores(id),
    to_store_id INTEGER REFERENCES stores(id),
    transfer_date DATE NOT NULL,
    expected_date DATE,
    received_date DATE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'received', 'cancelled')),
    transferred_by VARCHAR(100),
    received_by VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock transfer items table
CREATE TABLE IF NOT EXISTS stock_transfer_items (
    id SERIAL PRIMARY KEY,
    transfer_id INTEGER REFERENCES stock_transfers(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES items(id),
    quantity INTEGER NOT NULL,
    received_quantity INTEGER DEFAULT 0
);

-- Stock counts table
CREATE TABLE IF NOT EXISTS stock_counts (
    id SERIAL PRIMARY KEY,
    count_number VARCHAR(50) UNIQUE NOT NULL,
    store_id INTEGER REFERENCES stores(id),
    count_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'approved')),
    counted_by VARCHAR(100),
    approved_by VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock count items table
CREATE TABLE IF NOT EXISTS stock_count_items (
    id SERIAL PRIMARY KEY,
    count_id INTEGER REFERENCES stock_counts(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES items(id),
    system_quantity INTEGER NOT NULL,
    counted_quantity INTEGER NOT NULL,
    variance INTEGER GENERATED ALWAYS AS (counted_quantity - system_quantity) STORED,
    notes TEXT
);

-- Stations table (Point of Sale stations)
CREATE TABLE IF NOT EXISTS stations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(200) NOT NULL,
    responsible_user VARCHAR(100) NOT NULL,
    opening_balance DECIMAL(10,2) DEFAULT 0,
    total_sales DECIMAL(12,2) DEFAULT 0,
    expected_cash DECIMAL(12,2) DEFAULT 0,
    actual_cash DECIMAL(12,2) DEFAULT 0,
    variance DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'reconciled')),
    opened_at TIMESTAMP,
    closed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    expense_number VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    expense_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
    requested_by VARCHAR(100),
    approved_by VARCHAR(100),
    receipt_number VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_items_sku ON items(sku);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_active ON items(is_active);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_date ON stock_transfers(transfer_date);

-- Insert sample data
INSERT INTO stores (name, location, responsible_user, phone, email) VALUES
('Main Store', 'Downtown Addis Ababa', 'Ahmed Hassan', '+251-911-123456', 'ahmed@store.com'),
('Branch Store', 'Bole Addis Ababa', 'Fatima Mohammed', '+251-911-234567', 'fatima@store.com'),
('Warehouse', 'Industrial Zone', 'Dawit Bekele', '+251-911-345678', 'dawit@warehouse.com')
ON CONFLICT DO NOTHING;

INSERT INTO items (name, category, description, sku, unit, min_stock, max_stock, cost_price, sales_price, tax_rate, reorder_level, current_stock, valuation_method) VALUES
('Coffee Beans Premium', 'Beverages', 'High-quality Arabica coffee beans from Ethiopian highlands', 'COF-001', 'kg', 10, 100, 850.00, 1200.00, 15, 15, 45, 'FIFO'),
('Ethiopian Honey', 'Food', 'Pure natural honey from Ethiopian beekeepers', 'HON-001', 'bottle', 20, 200, 450.00, 650.00, 15, 25, 8, 'FIFO'),
('Traditional Injera Mix', 'Food', 'Traditional Ethiopian injera flour mix', 'INJ-001', 'kg', 30, 300, 180.00, 250.00, 15, 40, 125, 'FIFO')
ON CONFLICT (sku) DO NOTHING; 