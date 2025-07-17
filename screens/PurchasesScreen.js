import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import Card from "../components/Card";
import { purchasesAPI } from "../services/api";
import {
    borderRadius,
    colors,
    formatCurrency,
    globalStyles,
    spacing,
} from "../styles/theme";

const PurchasesScreen = ({ navigation }) => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  
  const [stats, setStats] = useState({});

  useEffect(() => {
    loadPurchasesData();
  }, []);

  const loadPurchasesData = async () => {
    try {
      const response = await purchasesAPI.getAll();
      if (response.data.success) {
        setPurchases(response.data.data);
        
        // Calculate stats from the data
        const totalPurchases = response.data.data.reduce((sum, p) => sum + p.totalAmount, 0);
        const pendingOrders = response.data.data.filter(p => p.status === 'pending').length;
        const uniqueSuppliers = new Set(response.data.data.map(p => p.supplier?.name || p.supplier)).size;
        
        setStats({
          totalPurchases,
          pendingOrders,
          totalSuppliers: uniqueSuppliers,
          thisMonthPurchases: totalPurchases, // For now, same as total
        });
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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPurchasesData();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "delivered":
        return colors.success;
      case "pending":
        return colors.warning;
      case "cancelled":
        return colors.error;
      default:
        return colors.gray[500];
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "paid":
        return colors.success;
      case "pending":
        return colors.warning;
      case "overdue":
        return colors.error;
      default:
        return colors.gray[500];
    }
  };

  const openPurchaseDetail = (purchase) => {
    setSelectedPurchase(purchase);
    setShowDetailModal(true);
  };

  const closePurchaseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedPurchase(null);
  };

  // Pagination logic
  const totalPages = Math.ceil(purchases.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPurchases = purchases.slice(startIndex, endIndex);

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

  const renderPaginationControls = () => (
    <View style={styles.paginationContainer}>
      <TouchableOpacity 
        style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
        onPress={goToPreviousPage}
        disabled={currentPage === 1}
      >
        <Ionicons name="chevron-back" size={20} color={currentPage === 1 ? colors.gray[400] : colors.primary} />
        <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonTextDisabled]}>
          Previous
        </Text>
      </TouchableOpacity>

      <View style={styles.paginationInfo}>
        <Text style={styles.paginationText}>
          Page {currentPage} of {totalPages}
        </Text>
        <Text style={styles.paginationSubtext}>
          {purchases.length} total purchases
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
        <Ionicons name="chevron-forward" size={20} color={currentPage === totalPages ? colors.gray[400] : colors.primary} />
      </TouchableOpacity>
    </View>
  );

  const renderPurchaseItem = ({ item }) => (
    <Card style={styles.purchaseCard}>
      <View style={styles.purchaseHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>{item.orderNumber}</Text>
          <Text style={styles.supplierName}>{item.supplier}</Text>
          <Text style={styles.orderDate}>{new Date(item.date).toLocaleDateString()}</Text>
        </View>
        <View style={styles.statusContainer}>
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
          <View style={[styles.statusBadge, { marginTop: spacing.xs }]}>
            <View style={[styles.statusDot, { backgroundColor: getPaymentStatusColor(item.paymentStatus) }]} />
            <Text style={[styles.statusText, { color: getPaymentStatusColor(item.paymentStatus) }]}>
              {item.paymentStatus.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.purchaseDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="bag" size={16} color={colors.gray[600]} />
            <Text style={styles.detailText}>{item.items} items</Text>
          </View>
          <Text style={styles.purchaseAmount}>{formatCurrency(item.amount)}</Text>
        </View>
      </View>

      <View style={styles.purchaseActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => openPurchaseDetail(item)}
        >
          <Ionicons name="eye" size={16} color={colors.primary} />
          <Text style={styles.actionButtonText}>View</Text>
        </TouchableOpacity>
        {item.status === "pending" && (
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="create" size={16} color={colors.primary} />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );

  return (
    <View style={globalStyles.container}>
      {/* Header */}
      <LinearGradient
        colors={[colors.blue[600], colors.blue[700]]}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Purchases</Text>
        <Text style={styles.headerSubtitle}>
          Total Credit of Supplier: {formatCurrency(stats.totalPurchases)}
        </Text>
        
        {/* Integrated Stats in Header */}
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

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={20} color={colors.primary} />
          <Text style={styles.filterButtonText}>Filter</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="download" size={20} color={colors.primary} />
          <Text style={styles.filterButtonText}>Export</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, styles.secondaryAction]}
          onPress={() => navigation.navigate('PurchaseOrder', { createMode: true, isCredit: true })}
        >
          <Ionicons name="card" size={20} color={colors.warning} />
          <Text style={[styles.filterButtonText, { color: colors.warning }]}>
            Credit Order
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, styles.primaryAction]}
          onPress={() => navigation.navigate('PurchaseOrder', { createMode: true })}
        >
          <Ionicons name="add" size={20} color={colors.white} />
          <Text style={[styles.filterButtonText, { color: colors.white }]}>
            New Order
          </Text>
        </TouchableOpacity>
      </View>

      {/* Purchases List */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Purchase Orders</Text>
        <Text style={styles.listSubtitle}>
          {purchases.length} orders this month
        </Text>
      </View>

      <FlatList
        data={paginatedPurchases}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPurchaseItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Pagination Controls */}
      {totalPages > 1 && renderPaginationControls()}


    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  headerTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    color: colors.white,
    fontSize: 16,
    opacity: 0.9,
  },
  headerStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
  },
  headerStatItem: {
    flex: 1,
    alignItems: "center",
  },
  headerStatValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: spacing.xs,
  },
  headerStatLabel: {
    fontSize: 12,
    color: colors.white,
    opacity: 0.9,
  },
  actionBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray[300],
    minWidth: 80,
  },
  primaryAction: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  secondaryAction: {
    backgroundColor: colors.gray[50],
    borderColor: colors.warning,
  },
  filterButtonText: {
    marginLeft: spacing.xs,
    fontSize: 14,
    fontWeight: "600",
    color: colors.gray[700],
  },
  listHeader: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.gray[800],
    marginBottom: spacing.xs,
  },
  listSubtitle: {
    fontSize: 14,
    color: colors.gray[600],
  },
  listContainer: {
    padding: spacing.md,
  },
  purchaseCard: {
    marginBottom: spacing.md,
  },
  purchaseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.gray[800],
    marginBottom: spacing.xs,
  },
  supplierName: {
    fontSize: 14,
    color: colors.blue[600],
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  orderDate: {
    fontSize: 14,
    color: colors.gray[600],
  },
  statusContainer: {
    alignItems: "flex-end",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gray[100],
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  purchaseDetails: {
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    paddingTop: spacing.md,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailText: {
    fontSize: 14,
    color: colors.gray[600],
    marginLeft: spacing.xs,
  },
  purchaseAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.blue[600],
  },
  purchaseActions: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  actionButtonText: {
    marginLeft: spacing.xs,
    fontSize: 14,
    fontWeight: "600",
    color: colors.gray[700],
  },

  // Pagination styles
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginVertical: spacing.sm,
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
    minHeight: 44,
    minWidth: 80,
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginHorizontal: spacing.xs,
  },
  paginationButtonTextDisabled: {
    color: colors.gray[400],
  },
  paginationInfo: {
    alignItems: 'center',
  },
  paginationText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[800],
  },
  paginationSubtext: {
    fontSize: 12,
    color: colors.gray[600],
    marginTop: spacing.xs,
  },
});

export default PurchasesScreen; 