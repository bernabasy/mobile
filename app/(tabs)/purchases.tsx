import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Search, Plus, CreditCard, ShoppingCart, Eye, Phone, CheckCircle } from "lucide-react-native";
import { router } from "expo-router";
import { purchasesAPI } from "../../services/api";

interface PurchaseOrder {
  id: number;
  orderNumber: string;
  supplier: string;
  supplierPhone: string;
  date: string;
  amount: number;
  status: 'delivered' | 'pending' | 'cancelled';
  items: number;
  paymentStatus: 'paid' | 'pending' | 'partial';
  type: 'credit' | 'cash';
  paidAmount?: number;
  remainingAmount?: number;
}

export default function PurchasesScreen() {
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [stats, setStats] = useState({
    totalPurchases: 0,
    pendingOrders: 0,
    totalSuppliers: 0,
    creditAmount: 0,
  });

  useEffect(() => {
    loadPurchasesData();
  }, []);

  useEffect(() => {
    filterPurchases();
  }, [searchQuery, purchases]);

  const loadPurchasesData = async () => {
    try {
      const response = await purchasesAPI.getAll();
      if (response.data.success) {
        const purchasesData = response.data.data;
        setPurchases(purchasesData);
        
        // Calculate stats from the data
        const mockStats = {
          totalPurchases: purchasesData.reduce((sum: number, p: any) => sum + (p.totalAmount || p.amount || 0), 0),
          pendingOrders: purchasesData.filter((p: any) => p.status === 'pending').length,
          totalSuppliers: new Set(purchasesData.map((p: any) => p.supplier?.name || p.supplier)).size,
          creditAmount: purchasesData
            .filter((p: any) => p.paymentMethod === 'credit')
            .reduce((sum: number, p: any) => sum + (p.remainingAmount || 0), 0),
        };
        
        setStats(mockStats);
      } else {
        throw new Error(response.data.message || 'Failed to load purchases');
      }
    } catch (error) {
      console.error("Error loading purchases data:", error);
      Alert.alert("Error", "Failed to load purchases data");
    } finally {
      setLoading(false);
    }
  };

  const filterPurchases = () => {
    if (!searchQuery.trim()) {
      setFilteredPurchases(purchases);
      setCurrentPage(1);
      return;
    }

    const filtered = purchases.filter(purchase =>
      purchase.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purchase.supplierPhone.includes(searchQuery)
    );
    
    setFilteredPurchases(filtered);
    setCurrentPage(1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "#10b981";
      case "pending": return "#f59e0b";
      case "cancelled": return "#ef4444";
      default: return "#6b7280";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "#10b981";
      case "pending": return "#f59e0b";
      case "partial": return "#f97316";
      default: return "#6b7280";
    }
  };

  const formatCurrency = (amount: number) => {
    return `Birr ${amount.toLocaleString()}`;
  };

  const handleCreateCreditOrder = () => {
    router.push('/purchase-order?type=credit');
  };

  const handleCreateNewOrder = () => {
    router.push('/purchase-order?type=cash');
  };

  const handleCallSupplier = (phone: string) => {
    Alert.alert("Call Supplier", `Call ${phone}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Call", onPress: () => console.log(`Calling ${phone}`) }
    ]);
  };

  const handleMarkAsReceived = (orderId: number) => {
    Alert.alert(
      "Mark as Received",
      "Mark this purchase order as received?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Mark Received", 
          onPress: () => {
            setPurchases(prev => prev.map(order =>
              order.id === orderId
                ? { ...order, status: "delivered" as const }
                : order
            ));
            Alert.alert("Success", "Purchase order marked as received");
          }
        }
      ]
    );
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPurchases = filteredPurchases.slice(startIndex, endIndex);

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const renderPurchaseItem = ({ item }: { item: PurchaseOrder }) => (
    <View style={styles.purchaseCard}>
      <View style={styles.purchaseHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>{item.orderNumber}</Text>
          <Text style={styles.supplierName}>{item.supplier}</Text>
          <Text style={styles.orderDate}>{new Date(item.date).toLocaleDateString()}</Text>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getPaymentStatusColor(item.paymentStatus), marginTop: 4 }]}>
            <Text style={styles.statusText}>{item.paymentStatus.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.purchaseDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <ShoppingCart size={16} color="#6b7280" />
            <Text style={styles.detailText}>{item.items} items</Text>
          </View>
          <Text style={styles.purchaseAmount}>{formatCurrency(item.amount)}</Text>
        </View>
        
        {item.type === 'credit' && item.remainingAmount && item.remainingAmount > 0 && (
          <View style={styles.creditInfo}>
            <Text style={styles.creditLabel}>Credit Outstanding:</Text>
            <Text style={styles.creditAmount}>{formatCurrency(item.remainingAmount)}</Text>
          </View>
        )}
      </View>

      <View style={styles.purchaseActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => console.log('View details')}
        >
          <Eye size={16} color="#3b82f6" />
          <Text style={styles.actionButtonText}>View</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleCallSupplier(item.supplierPhone)}
        >
          <Phone size={16} color="#10b981" />
          <Text style={styles.actionButtonText}>Call</Text>
        </TouchableOpacity>
        
        {item.status === "pending" && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleMarkAsReceived(item.id)}
          >
            <CheckCircle size={16} color="#f59e0b" />
            <Text style={styles.actionButtonText}>Received</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderPaginationControls = () => {
    if (totalPages <= 1) return null;

    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity 
          style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
          onPress={goToPreviousPage}
          disabled={currentPage === 1}
        >
          <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonTextDisabled]}>
            Previous
          </Text>
        </TouchableOpacity>

        <View style={styles.paginationInfo}>
          <Text style={styles.paginationText}>
            Page {currentPage} of {totalPages}
          </Text>
          <Text style={styles.paginationSubtext}>
            {filteredPurchases.length} orders
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
          onPress={goToNextPage}
          disabled={currentPage === totalPages}
        >
          <Text style={[styles.paginationButtonText, currentPage === totalPages && styles.paginationButtonTextDisabled]}>
            Next
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#2563eb", "#1d4ed8"]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Purchases</Text>
        <Text style={styles.headerSubtitle}>
          Total Credit: {formatCurrency(stats.creditAmount)}
        </Text>
        
        {/* Stats Grid */}
        <View style={styles.headerStats}>
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatValue}>{formatCurrency(stats.totalPurchases)}</Text>
            <Text style={styles.headerStatLabel}>Total Purchases</Text>
          </View>
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatValue}>{stats.pendingOrders}</Text>
            <Text style={styles.headerStatLabel}>Pending Orders</Text>
          </View>
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatValue}>{stats.totalSuppliers}</Text>
            <Text style={styles.headerStatLabel}>Suppliers</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Search and Action Bar */}
      <View style={styles.searchActionBar}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders, suppliers..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.creditBtn]}
            onPress={handleCreateCreditOrder}
          >
            <CreditCard size={18} color="#ffffff" />
            <Text style={styles.actionBtnText}>Credit Order</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionBtn, styles.newOrderBtn]}
            onPress={handleCreateNewOrder}
          >
            <Plus size={18} color="#ffffff" />
            <Text style={styles.actionBtnText}>New Order</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Purchase Orders List */}
      <FlatList
        data={paginatedPurchases}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPurchaseItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ShoppingCart size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Purchase Orders Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try adjusting your search terms' : 'Create your first purchase order to get started'}
            </Text>
          </View>
        }
      />

      {/* Pagination */}
      {renderPaginationControls()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 32,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  headerSubtitle: {
    color: "#ffffff",
    fontSize: 16,
    opacity: 0.9,
    marginBottom: 20,
  },
  headerStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerStatItem: {
    flex: 1,
    alignItems: "center",
  },
  headerStatValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  headerStatLabel: {
    fontSize: 12,
    color: "#ffffff",
    opacity: 0.9,
    textAlign: "center",
  },
  searchActionBar: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1f2937",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  creditBtn: {
    backgroundColor: "#f59e0b",
  },
  newOrderBtn: {
    backgroundColor: "#16a34a",
  },
  actionBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  purchaseCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  purchaseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  supplierName: {
    fontSize: 16,
    color: "#2563eb",
    fontWeight: "600",
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: "#6b7280",
  },
  statusContainer: {
    alignItems: "flex-end",
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
  },
  purchaseDetails: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 16,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#6b7280",
  },
  purchaseAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2563eb",
  },
  creditInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  creditLabel: {
    fontSize: 14,
    color: "#92400e",
    fontWeight: "500",
  },
  creditAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#92400e",
  },
  purchaseActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  paginationButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    minWidth: 80,
    alignItems: "center",
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  paginationButtonTextDisabled: {
    color: "#9ca3af",
  },
  paginationInfo: {
    alignItems: "center",
  },
  paginationText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  paginationSubtext: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    paddingHorizontal: 32,
  },
});