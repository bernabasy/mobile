/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

// Item Management Types
export interface Item {
  id: string;
  name: string;
  category: string;
  description: string;
  sku: string;
  barcode?: string;
  unit: string;
  minStock: number;
  maxStock: number;
  costPrice: number;
  salesPrice: number;
  taxRate: number;
  reorderLevel: number;
  currentStock: number;
  valuationMethod: "FIFO" | "LIFO" | "Average";
  variants: ItemVariant[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ItemVariant {
  id: string;
  name: string;
  sku: string;
  costPrice: number;
  salesPrice: number;
  stock: number;
}

// Supplier Management Types
export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  taxId: string;
  paymentTerms: string;
  creditLimit: number;
  currentBalance: number;
  totalPurchases: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Customer Management Types
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  taxId?: string;
  paymentTerms: string;
  creditLimit: number;
  currentBalance: number;
  totalSales: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Purchase Management Types
export interface Purchase {
  id: string;
  purchaseNumber: string;
  supplierId: string;
  supplier: Supplier;
  orderDate: Date;
  expectedDate?: Date;
  receivedDate?: Date;
  status: "pending" | "partial" | "received" | "cancelled";
  items: PurchaseItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  withholdingRate: number;
  withholdingAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod: "cash" | "bank" | "check" | "credit";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseItem {
  id: string;
  itemId: string;
  item: Item;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  receivedQuantity: number;
}

// Sales Management Types
export interface Sale {
  id: string;
  saleNumber: string;
  customerId: string;
  customer: Customer;
  saleDate: Date;
  dueDate?: Date;
  status: "pending" | "partial" | "paid" | "cancelled";
  items: SaleItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  withholdingRate: number;
  withholdingAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod: "cash" | "bank" | "check" | "credit";
  salesPerson: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaleItem {
  id: string;
  itemId: string;
  item: Item;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// Stock Management Types
export interface Store {
  id: string;
  name: string;
  location: string;
  responsibleUser: string;
  phone: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockTransfer {
  id: string;
  transferNumber: string;
  fromStoreId: string;
  toStoreId: string;
  fromStore: Store;
  toStore: Store;
  items: StockTransferItem[];
  status: "pending" | "in-transit" | "received" | "cancelled";
  transferDate: Date;
  expectedDate?: Date;
  receivedDate?: Date;
  transferredBy: string;
  receivedBy?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockTransferItem {
  id: string;
  itemId: string;
  item: Item;
  quantity: number;
  receivedQuantity: number;
}

export interface StockCount {
  id: string;
  countNumber: string;
  storeId: string;
  store: Store;
  countDate: Date;
  status: "pending" | "completed" | "approved";
  countedBy: string;
  approvedBy?: string;
  items: StockCountItem[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockCountItem {
  id: string;
  itemId: string;
  item: Item;
  systemQuantity: number;
  countedQuantity: number;
  variance: number;
  notes?: string;
}

// Station Management Types
export interface Station {
  id: string;
  name: string;
  location: string;
  responsibleUser: string;
  openingBalance: number;
  totalSales: number;
  expectedCash: number;
  actualCash: number;
  variance: number;
  status: "open" | "closed" | "reconciled";
  openedAt: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Expense Management Types
export interface Expense {
  id: string;
  expenseNumber: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: "cash" | "bank" | "check";
  expenseDate: Date;
  approvedBy?: string;
  status: "pending" | "approved" | "rejected";
  receipt?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Dashboard Types
export interface DashboardStats {
  inventoryValue: number;
  todaySales: number;
  lowStockItems: number;
  totalSuppliers: number;
  totalCustomers: number;
  pendingPurchases: number;
  pendingSales: number;
  totalCredit: number;
  totalDebit: number;
}

export interface LowStockAlert {
  item: Item;
  currentStock: number;
  reorderLevel: number;
  status: "critical" | "low" | "reorder";
  daysWithoutSales: number;
  suggestedOrderQuantity: number;
  currentStockValue: number;
  store: Store;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Request Types
export interface CreateItemRequest {
  name: string;
  category: string;
  description: string;
  sku: string;
  barcode?: string;
  unit: string;
  minStock: number;
  maxStock: number;
  costPrice: number;
  salesPrice: number;
  taxRate: number;
  reorderLevel: number;
  currentStock: number;
  valuationMethod: "FIFO" | "LIFO" | "Average";
  variants?: Omit<ItemVariant, "id">[];
}

export interface UpdateItemRequest extends Partial<CreateItemRequest> {
  id: string;
}

export interface CreateSupplierRequest {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  taxId: string;
  paymentTerms: string;
  creditLimit: number;
}

export interface CreateCustomerRequest {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  taxId?: string;
  paymentTerms: string;
  creditLimit: number;
}

export interface CreatePurchaseRequest {
  supplierId: string;
  orderDate: Date;
  expectedDate?: Date;
  items: Omit<PurchaseItem, "id" | "item" | "receivedQuantity">[];
  taxRate: number;
  withholdingRate: number;
  paymentMethod: "cash" | "bank" | "check" | "credit";
  notes?: string;
}

export interface CreateSaleRequest {
  customerId: string;
  saleDate: Date;
  dueDate?: Date;
  items: Omit<SaleItem, "id" | "item">[];
  taxRate: number;
  withholdingRate: number;
  paymentMethod: "cash" | "bank" | "check" | "credit";
  salesPerson: string;
  notes?: string;
}

export interface CreateStockTransferRequest {
  fromStoreId: string;
  toStoreId: string;
  items: Omit<StockTransferItem, "id" | "item" | "receivedQuantity">[];
  transferDate: Date;
  expectedDate?: Date;
  transferredBy: string;
  notes?: string;
}

export interface CreateStockCountRequest {
  storeId: string;
  countDate: Date;
  countedBy: string;
  items: Omit<StockCountItem, "id" | "item" | "variance">[];
  notes?: string;
}

export interface CreateExpenseRequest {
  category: string;
  description: string;
  amount: number;
  paymentMethod: "cash" | "bank" | "check";
  expenseDate: Date;
  receipt?: string;
  notes?: string;
}

export interface CreateStationRequest {
  name: string;
  location: string;
  responsibleUser: string;
  openingBalance: number;
}

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}
