export interface User {
  id: string;
  firstname: string;
  middlename?: string;
  lastname: string;
  mobile: string;
  isVerified: boolean;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Item {
  id: string;
  name: string;
  categoryId: string;
  category?: Category;
  description?: string;
  sku: string;
  barcode?: string;
  unit: string;
  minStock: number;
  maxStock: number;
  reorderLevel: number;
  currentStock: number;
  costPrice: number;
  sellingPrice: number;
  taxRate: number;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country: string;
  taxId?: string;
  paymentTerms: string;
  creditLimit: number;
  currentBalance: number;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country: string;
  taxId?: string;
  paymentTerms: string;
  creditLimit: number;
  currentBalance: number;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplier?: Supplier;
  orderDate: Date;
  expectedDeliveryDate?: Date;
  receivedDate?: Date;
  status: 'pending' | 'partial' | 'received' | 'cancelled';
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  paymentMethod: 'cash' | 'credit' | 'bank' | 'check';
  notes?: string;
  items: PurchaseOrderItem[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  itemId: string;
  item?: Item;
  quantity: number;
  receivedQuantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customer?: Customer;
  orderDate: Date;
  deliveryDate?: Date;
  status: 'pending' | 'completed' | 'cancelled';
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  paymentMethod: 'cash' | 'credit' | 'bank' | 'check';
  salesPerson: string;
  notes?: string;
  items: SalesOrderItem[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalesOrderItem {
  id: string;
  salesOrderId: string;
  itemId: string;
  item?: Item;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  item?: Item;
  transactionType: 'purchase' | 'sale' | 'adjustment' | 'transfer';
  referenceId?: string;
  quantityChange: number;
  unitCost?: number;
  notes?: string;
  createdBy: string;
  createdAt: Date;
}

export interface StockAdjustment {
  id: string;
  itemId: string;
  item?: Item;
  adjustmentType: 'increase' | 'decrease' | 'correction';
  quantityBefore: number;
  quantityAfter: number;
  quantityChange: number;
  reason: string;
  notes?: string;
  createdBy: string;
  createdAt: Date;
}

export interface Payment {
  id: string;
  referenceType: 'purchase' | 'sale';
  referenceId: string;
  amount: number;
  paymentMethod: 'cash' | 'bank' | 'check' | 'mobile';
  paymentDate: Date;
  referenceNumber?: string;
  notes?: string;
  createdBy: string;
  createdAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: any[];
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardStats {
  totalItems: number;
  lowStockItems: number;
  totalSuppliers: number;
  totalCustomers: number;
  todaysSales: number;
  todaysPurchases: number;
  inventoryValue: number;
  pendingOrders: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JWTPayload {
  userId: string;
  mobile: string;
  iat?: number;
  exp?: number;
}