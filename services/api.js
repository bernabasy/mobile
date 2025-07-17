import axios from "axios";
import { Platform } from "react-native";

// Configure your backend URL - change this to your backend server URL
// Use 10.0.2.2 for Android emulator, localhost for iOS simulator

const getBaseUrl = () => {
  if (Platform.OS === 'android') {
    return "http://192.168.8.123:8080/api"; // Use your computer's IP for Android
  } else {
    return "http://localhost:8080/api"; // iOS simulator
  }
};

const BASE_URL = getBaseUrl();

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get("/dashboard/stats"),
  getLowStock: () => api.get("/dashboard/low-stock"),
  getRecentTransactions: () => api.get("/dashboard/recent-transactions"),
  getTodaysSales: () => api.get("/dashboard/today-sales"),
};

// Items API
export const itemsAPI = {
  getAll: (params = {}) => api.get("/items", { params }),
  getById: (id) => api.get(`/items/${id}`),
  create: (data) => api.post("/items", data),
  update: (id, data) => api.put(`/items/${id}`, data),
  delete: (id) => api.delete(`/items/${id}`),
  getLowStock: () => api.get("/items/reports/low-stock"),
  getCategories: () => api.get("/items/meta/categories"),
};

// Suppliers API
export const suppliersAPI = {
  getAll: (params = {}) => api.get("/suppliers", { params }),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post("/suppliers", data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
  getTransactions: (id) => api.get(`/suppliers/${id}/transactions`),
};

// Customers API
export const customersAPI = {
  getAll: (params = {}) => api.get("/customers", { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post("/customers", data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
  getTransactions: (id) => api.get(`/customers/${id}/transactions`),
};

// Purchases API
export const purchasesAPI = {
  getAll: (params = {}) => api.get("/purchases", { params }),
  getById: (id) => api.get(`/purchases/${id}`),
  create: (data) => api.post("/purchases", data),
  updateReceiving: (id, data) => api.put(`/purchases/${id}/receive`, data),
  recordPayment: (id, data) => api.put(`/purchases/${id}/payment`, data),
};

// Sales API
export const salesAPI = {
  getAll: (params = {}) => api.get("/sales", { params }),
  getById: (id) => api.get(`/sales/${id}`),
  create: (data) => api.post("/sales", data),
  recordPayment: (id, data) => api.put(`/sales/${id}/payment`, data),
  getTodaysReport: () => api.get("/sales/reports/today"),
};

// Stock API
export const stockAPI = {
  getTransfers: (params = {}) => api.get("/stock/transfers", { params }),
  createTransfer: (data) => api.post("/stock/transfers", data),
  getCounts: (params = {}) => api.get("/stock/counts", { params }),
  createCount: (data) => api.post("/stock/counts", data),
  approveCount: (id, data) => api.put(`/stock/counts/${id}/approve`, data),
};

// Stores API
export const storesAPI = {
  getAll: (params = {}) => api.get("/stores", { params }),
  getById: (id) => api.get(`/stores/${id}`),
  create: (data) => api.post("/stores", data),
  update: (id, data) => api.put(`/stores/${id}`, data),
  delete: (id) => api.delete(`/stores/${id}`),
};

// Expenses API
export const expensesAPI = {
  getAll: (params = {}) => api.get("/expenses", { params }),
  getById: (id) => api.get(`/expenses/${id}`),
  create: (data) => api.post("/expenses", data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  approve: (id, data) => api.put(`/expenses/${id}/approve`, data),
  reject: (id, data) => api.put(`/expenses/${id}/reject`, data),
  getCategories: () => api.get("/expenses/meta/categories"),
  getTodaysReport: () => api.get("/expenses/reports/today"),
};

// Stations API
export const stationsAPI = {
  getAll: (params = {}) => api.get("/stations", { params }),
  getById: (id) => api.get(`/stations/${id}`),
  create: (data) => api.post("/stations", data),
  close: (id, data) => api.put(`/stations/${id}/close`, data),
  reconcile: (id) => api.put(`/stations/${id}/reconcile`),
  updateSales: (id, data) => api.put(`/stations/${id}/sales`, data),
  getActive: () => api.get("/stations/reports/active"),
  getSummary: () => api.get("/stations/reports/summary"),
};

// Error handling interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", {
      message: error.message,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data
    });
    return Promise.reject(error);
  },
);

export default api;
