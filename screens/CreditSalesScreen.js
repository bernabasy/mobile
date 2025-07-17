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
import { salesAPI } from "../services/api";
import {
    borderRadius,
    colors,
    formatCurrency,
    globalStyles,
    spacing,
} from "../styles/theme";

const CreditSalesScreen = ({ navigation }) => {
  const [creditSales, setCreditSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCreditSale, setSelectedCreditSale] = useState(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  
  const [stats, setStats] = useState({});

  useEffect(() => {
    loadCreditSalesData();
  }, []);

  const loadCreditSalesData = async () => {
    try {
      const response = await salesAPI.getAll({ paymentMethod: 'credit' });
      if (response.data.success) {
        const salesData = response.data.data;
        
        // Format sales data for display
        const formattedSales = salesData.map(sale => ({
          ...sale,
          customerName: sale.customer?.name || sale.customer || 'Unknown Customer',
          status: sale.remainingAmount > 0 ? 
                  (sale.paidAmount > 0 ? 'partial' : 'unpaid') : 'paid'
        }));
        
        setCreditSales(formattedSales);

        // Calculate stats from the data
        const totalCreditSales = salesData.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
        const totalOutstanding = salesData.reduce((sum, sale) => sum + (sale.remainingAmount || 0), 0);
        const uniqueCustomers = new Set(salesData.map(sale => sale.customer?.id || sale.customerId)).size;
        
        // Calculate overdue amount (simplified - could check actual due dates)
        const overdueAmount = salesData
          .filter(sale => sale.remainingAmount > 0 && new Date(sale.dueDate) < new Date())
          .reduce((sum, sale) => sum + (sale.remainingAmount || 0), 0);

        setStats({
          totalCreditSales,
          totalOutstanding,
          totalCustomers: uniqueCustomers,
          overdueAmount,
        });
      } else {
        throw new Error(response.data.message || 'Failed to load credit sales data');
      }
    } catch (error) {
      console.error("Error loading credit sales data:", error);
      Alert.alert("Error", "Failed to load credit sales data");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCreditSalesData();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "paid":
        return colors.success;
      case "partial":
        return colors.warning;
      case "unpaid":
        return colors.error;
      case "overdue":
        return colors.red[600];
      default:
        return colors.gray[500];
    }
  };

  const handlePayment = (item) => {
    Alert.alert(
      "Record Payment",
      `Record payment for ${item.customerName}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Record Payment", onPress: () => console.log("Payment recorded") }
      ]
    );
  };

  const openCreditSaleDetail = (creditSale) => {
    setSelectedCreditSale(creditSale);
    setShowDetailModal(true);
  };

  const closeCreditSaleDetailModal = () => {
    setShowDetailModal(false);
    setSelectedCreditSale(null);
  };

  // Pagination logic
  const totalPages = Math.ceil(creditSales.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCreditSales = creditSales.slice(startIndex, endIndex);

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
          {creditSales.length} total credit sales
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

  const renderCreditSaleItem = ({ item }) => (
    <Card style={styles.creditCard}>
      <View style={styles.creditHeader}>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{item.customerName}</Text>
          <Text style={styles.saleDate}>Sale Date: {item.saleDate}</Text>
          <Text style={styles.dueDate}>Due Date: {item.dueDate}</Text>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.amountDetails}>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Total Amount:</Text>
          <Text style={styles.totalAmount}>{formatCurrency(item.totalAmount)}</Text>
        </View>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Paid Amount:</Text>
          <Text style={styles.paidAmount}>{formatCurrency(item.paidAmount)}</Text>
        </View>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Remaining:</Text>
          <Text style={[styles.remainingAmount, { color: getStatusColor(item.status) }]}>
            {formatCurrency(item.remainingAmount)}
          </Text>
        </View>
      </View>

      {item.remainingAmount > 0 && (
        <View style={styles.creditActions}>
          <TouchableOpacity 
            style={styles.paymentButton}
            onPress={() => handlePayment(item)}
          >
            <Ionicons name="cash" size={16} color={colors.white} />
            <Text style={styles.paymentButtonText}>Record Payment</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.viewButton}
            onPress={() => openCreditSaleDetail(item)}
          >
            <Ionicons name="eye" size={16} color={colors.primary} />
            <Text style={styles.viewButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );

  return (
    <View style={globalStyles.container}>
      {/* Header */}
      <LinearGradient
        colors={[colors.red[500], colors.red[600]]}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Credit Sales</Text>
        
        {/* Integrated Stats in Header */}
        <View style={styles.headerStats}>
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatValue}>{formatCurrency(stats.totalCreditSales)}</Text>
            <Text style={styles.headerStatLabel}>Total Credit</Text>
          </View>
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatValue}>{formatCurrency(stats.totalOutstanding)}</Text>
            <Text style={styles.headerStatLabel}>Outstanding</Text>
          </View>
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatValue}>{stats.totalCustomers}</Text>
            <Text style={styles.headerStatLabel}>Customers</Text>
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
          style={[styles.filterButton, styles.primaryAction]}
          onPress={() => navigation.navigate("SalesOrder", { createMode: true, isCredit: true })}
        >
          <Ionicons name="add" size={20} color={colors.white} />
          <Text style={[styles.filterButtonText, { color: colors.white }]}>
            New Credit Sale
          </Text>
        </TouchableOpacity>
      </View>

      {/* Credit Sales List */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Credit Sales</Text>
        <Text style={styles.listSubtitle}>
          {creditSales.length} credit sales
        </Text>
      </View>

      <FlatList
        data={paginatedCreditSales}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderCreditSaleItem}
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
    marginBottom: spacing.sm,
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
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  primaryAction: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
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
  creditCard: {
    marginBottom: spacing.md,
  },
  creditHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.gray[800],
    marginBottom: spacing.xs,
  },
  saleDate: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  dueDate: {
    fontSize: 14,
    color: colors.gray[600],
  },
  statusContainer: {
    alignItems: "flex-end",
  },
  statusBadge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.white,
  },
  amountDetails: {
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    paddingTop: spacing.md,
    marginBottom: spacing.md,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  amountLabel: {
    fontSize: 14,
    color: colors.gray[600],
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.gray[800],
  },
  paidAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.success,
  },
  remainingAmount: {
    fontSize: 14,
    fontWeight: "600",
  },
  creditActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    paddingTop: spacing.md,
  },
  paymentButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.success,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    flex: 1,
    marginRight: spacing.sm,
    justifyContent: "center",
  },
  paymentButtonText: {
    marginLeft: spacing.xs,
    fontSize: 14,
    fontWeight: "600",
    color: colors.white,
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray[300],
    justifyContent: "center",
  },
  viewButtonText: {
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

export default CreditSalesScreen; 