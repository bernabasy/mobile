import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
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

const TodaysSalesScreen = ({ navigation }) => {
  const [todayStats, setTodayStats] = useState({
    totalSales: 0,
    transactionCount: 0,
    averageSale: 0,
    cashSales: 0,
    cardSales: 0,
  });
  const [todaySales, setTodaySales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Memoized function to prevent re-creation on each render
  const loadTodaysData = useCallback(async () => {
    try {
      const response = await salesAPI.getTodaysReport();
      if (response.data.success) {
        const salesData = response.data.data;
        
        // Calculate stats from the sales data
        const totalSales = salesData.reduce((sum, sale) => sum + (sale.totalAmount || sale.amount || 0), 0);
        const transactionCount = salesData.length;
        const averageSale = transactionCount > 0 ? totalSales / transactionCount : 0;
        const cashSales = salesData
          .filter(sale => sale.paymentMethod === 'cash')
          .reduce((sum, sale) => sum + (sale.totalAmount || sale.amount || 0), 0);
        const cardSales = salesData
          .filter(sale => sale.paymentMethod === 'card')
          .reduce((sum, sale) => sum + (sale.totalAmount || sale.amount || 0), 0);

        setTodayStats({
          totalSales,
          transactionCount,
          averageSale,
          cashSales,
          cardSales,
        });

        // Format sales data for display
        const formattedSales = salesData.map(sale => ({
          ...sale,
          customer: sale.customer?.name || sale.customer || 'Unknown Customer',
          time: new Date(sale.saleDate || sale.date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }),
          items: sale.items?.length || 0,
          amount: sale.totalAmount || sale.amount || 0,
        }));

        setTodaySales(formattedSales);
      } else {
        throw new Error(response.data.message || 'Failed to load today\'s sales data');
      }
    } catch (error) {
      console.error("Error loading today's data:", error);
      Alert.alert("Error", "Failed to load today's sales data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTodaysData();
  }, [loadTodaysData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTodaysData();
    setRefreshing(false);
  }, [loadTodaysData]);

  // Memoized components to prevent unnecessary re-renders
  const StatCard = useCallback(({ title, value, icon, color = colors.primary }) => (
    <Card style={styles.statCard}>
      <View style={styles.statHeader}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </Card>
  ), []);

  const SaleItem = useCallback(({ sale }) => (
    <Card style={styles.saleCard}>
      <View style={styles.saleHeader}>
        <View>
          <Text style={styles.customerName}>{sale.customer}</Text>
          <Text style={styles.saleTime}>{sale.time}</Text>
        </View>
        <View style={styles.saleRight}>
          <Text style={styles.saleAmount}>{formatCurrency(sale.amount || 0)}</Text>
          <View style={[
            styles.paymentBadge,
            { backgroundColor: sale.paymentMethod === 'cash' ? colors.success : colors.info }
          ]}>
            <Text style={styles.paymentText}>
              {sale.paymentMethod?.toUpperCase() || 'CASH'}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.saleDetails}>
        <Text style={styles.saleInfo}>
          {sale.items || 0} items • {sale.salesPerson || 'Unknown'}
        </Text>
      </View>
    </Card>
  ), []);

  // Memoized stats display
  const statsData = useMemo(() => [
    {
      title: "Total Sales",
      value: formatCurrency(todayStats.totalSales || 0),
      icon: "cash-outline",
      color: colors.success,
    },
    {
      title: "Transactions",
      value: (todayStats.transactionCount || 0).toString(),
      icon: "receipt-outline",
      color: colors.info,
    },
    {
      title: "Average Sale",
      value: formatCurrency(todayStats.averageSale || 0),
      icon: "trending-up-outline",
      color: colors.warning,
    },
    {
      title: "Cash Sales",
      value: formatCurrency(todayStats.cashSales || 0),
      icon: "wallet-outline",
      color: colors.primary,
    },
  ], [todayStats]);

  const renderSaleItem = useCallback(({ item }) => (
    <SaleItem sale={item} />
  ), [SaleItem]);

  const keyExtractor = useCallback((item) => item.id.toString(), []);

  // Pagination logic
  const totalPages = Math.ceil(todaySales.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSales = todaySales.slice(startIndex, endIndex);

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
          {todaySales.length} today's sales
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

  return (
    <FlatList
      style={globalStyles.container}
      data={[{ key: 'header' }, ...paginatedSales, ...(totalPages > 1 ? [{ key: 'pagination' }] : [])]}
      renderItem={({ item, index }) => {
        if (item.key === 'header') {
          return (
            <View>
              {/* Header */}
              <LinearGradient
                colors={[colors.primary, colors.green[700]]}
                style={styles.header}
              >
                <View style={styles.headerContent}>
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                  >
                    <Ionicons name="arrow-back" size={24} color={colors.white} />
                  </TouchableOpacity>
                  <Text style={styles.headerTitle}>Today's Sales</Text>
                  <TouchableOpacity style={styles.refreshButton}>
                    <Ionicons name="refresh" size={24} color={colors.white} />
                  </TouchableOpacity>
                </View>
                
                {/* Integrated Stats in Header */}
                <View style={styles.headerStatsGrid}>
                  <View style={styles.headerStatsRow}>
                    <View style={styles.headerStatItem}>
                      <Text style={styles.headerStatValue}>
                        {formatCurrency(todayStats.totalSales || 0)}
                      </Text>
                      <Text style={styles.headerStatLabel}>Total Sales</Text>
                    </View>
                    <View style={styles.headerStatItem}>
                      <Text style={styles.headerStatValue}>
                        {(todayStats.transactionCount || 0).toString()}
                      </Text>
                      <Text style={styles.headerStatLabel}>Transactions</Text>
                    </View>
                  </View>
                  <View style={styles.headerStatsRow}>
                    <View style={styles.headerStatItem}>
                      <Text style={styles.headerStatValue}>
                        {formatCurrency(todayStats.averageSale || 0)}
                      </Text>
                      <Text style={styles.headerStatLabel}>Average Sale</Text>
                    </View>
                    <View style={styles.headerStatItem}>
                      <Text style={styles.headerStatValue}>
                        {formatCurrency(todayStats.cashSales || 0)}
                      </Text>
                      <Text style={styles.headerStatLabel}>Cash Sales</Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>

              {/* Section Header */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Sales Transactions</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => navigation.navigate("Sales")}
                >
                  <Ionicons name="add" size={20} color={colors.white} />
                </TouchableOpacity>
              </View>
            </View>
          );
        }
        if (item.key === 'pagination') {
          return renderPaginationControls();
        }
        return <SaleItem sale={item} />;
      }}
      keyExtractor={(item, index) => item.key || item.id.toString()}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
      removeClippedSubviews={true} // Memory optimization
      maxToRenderPerBatch={5} // Reduce initial render load
      windowSize={10} // Reduce memory footprint
    />
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
    ...globalStyles.backButton,
  },
  headerTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: spacing.xs,
  },
  headerDate: {
    color: colors.white,
    fontSize: 16,
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
  actionButton: {
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
  actionButtonText: {
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
  saleCard: {
    marginBottom: spacing.md,
  },
  saleHeader: {
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
  saleTime: {
    fontSize: 14,
    color: colors.gray[600],
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
  saleDetails: {
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    paddingTop: spacing.md,
  },
  saleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
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
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  saleAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.success,
  },
  viewButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  viewButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl * 2,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.gray[800],
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.gray[600],
    textAlign: "center",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  createSaleButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
  },
  createSaleButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  refreshButton: {
    marginLeft: "auto",
    ...globalStyles.refreshButton,
  },
  sectionHeader: {
    padding: spacing.md,
    backgroundColor: colors.white,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.gray[800],
  },
  addButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  paymentBadge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
  },
  paymentText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.white,
  },
  headerStatsGrid: {
    padding: spacing.md,
  },
     headerStatsRow: {
     flexDirection: "row",
     justifyContent: "space-between",
     marginBottom: spacing.sm,
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

export default TodaysSalesScreen; 