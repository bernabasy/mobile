import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useState } from "react";
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { dashboardAPI } from "../services/api";
import {
    borderRadius,
    colors,
    formatCurrency,
    globalStyles,
    shadows,
    spacing,
} from "../styles/theme";

const MainHomeScreen = ({ navigation }) => {
  const [stats, setStats] = useState({
    inventoryValue: 68800,
    todaySales: 1250,
    lowStockItems: 3,
    totalCredit: 8750,
    totalDebit: 12500,
  });
  const [refreshing, setRefreshing] = useState(false);
  
  // Recent sales data
  const recentSales = [
    { id: 1, customer: "John Doe", amount: 1458, time: "2 mins ago", avatar: "🧑" },
    { id: 2, customer: "Mary Smith", amount: 2100, time: "5 mins ago", avatar: "👩" },
    { id: 3, customer: "Berna Joseph", amount: 1750, time: "8 mins ago", avatar: "👩" },
  ];

  // Memoized function to prevent re-creation on each render
  const loadDashboardData = useCallback(async () => {
    try {
      const response = await dashboardAPI.getStats();
      if (response.data.success) {
        setStats(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to load dashboard data');
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      Alert.alert("Error", "Failed to load dashboard data");
      // Fallback to default values
      setStats({
        inventoryValue: 0,
        todaySales: 0,
        lowStockItems: 0,
        totalCredit: 0,
        totalDebit: 0,
      });
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }, [loadDashboardData]);

  // Memoized components to prevent unnecessary re-renders
  const HeaderButton = useCallback(({ icon, title, onPress }) => (
    <TouchableOpacity style={styles.headerButton} onPress={onPress}>
      <Ionicons name={icon} size={20} color={colors.white} />
      <Text style={styles.headerButtonText}>{title}</Text>
    </TouchableOpacity>
  ), []);

  const NavigationCard = useCallback(({ title, subtitle, icon, colors: cardColors, onPress }) => (
    <TouchableOpacity style={styles.navCardContainer} onPress={onPress}>
      <LinearGradient colors={cardColors} style={styles.navCard}>
        <View style={styles.navCardContent}>
          <Text style={styles.navCardTitle}>{title}</Text>
          <Text style={styles.navCardSubtitle}>{subtitle}</Text>
        </View>
        <Ionicons name={icon} size={24} color={colors.white} />
      </LinearGradient>
    </TouchableOpacity>
  ), []);

  // Navigation handlers
  const navigationHandlers = {
    shop: () => navigation.navigate("Shop"),
    stock: () => navigation.navigate("Stock"),
    purchases: () => navigation.navigate("Purchases"),
    sales: () => navigation.navigate("Sales"),
    creditSales: () => navigation.navigate("CreditSales"),
    todaysSales: () => navigation.navigate("TodaysSales"),
    customers: () => navigation.navigate("Customers"),
    suppliers: () => navigation.navigate("Suppliers"),
    settings: () => navigation.navigate("Settings"),
    salesOrder: () => navigation.navigate("SalesOrder", { createMode: true }),
    purchaseOrder: () => navigation.navigate("PurchaseOrder"),
  };

  return (
    <ScrollView
      style={globalStyles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
      removeClippedSubviews={true} // Memory optimization
      maxToRenderPerBatch={10} // Reduce initial render load
    >
      {/* Header Section with Gradient */}
      <LinearGradient
        colors={[colors.primary, colors.green[700]]}
        style={styles.header}
      >
        <TouchableOpacity style={styles.refreshButton}>
          <Ionicons name="refresh" size={18} color={colors.white} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>INVENTORY VALUE</Text>
          <Text style={styles.headerAmount}>
            Birr. {Number(stats.inventoryValue || 0).toLocaleString()}.00
          </Text>
          
          {/* Shop and Stock buttons in header */}
          <View style={styles.headerButtonsRow}>
            <HeaderButton
              icon="storefront-outline"
              title="SHOPS"
              onPress={navigationHandlers.shop}
            />
            <HeaderButton
              icon="layers-outline"
              title="STOCK"
              onPress={navigationHandlers.stock}
            />
          </View>
        </View>
      </LinearGradient>
      

      {/* Made For You Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>MADE FOR YOU</Text>
      </View>

      {/* Navigation Cards Grid - 2x2 Layout - Equal Size */}
      <View style={styles.navigationGrid}>
        {/* First Row */}
        <View style={styles.cardRow}>
          <NavigationCard
            title="PURCHASES"
            subtitle={`Credit: ${formatCurrency(stats.totalCredit || 0)}`}
            icon="cart-outline"
            colors={[colors.blue[600], colors.blue[700]]}
            onPress={navigationHandlers.purchases}
          />
          <NavigationCard
            title="SALES"
            subtitle={`Debit: ${formatCurrency(stats.totalDebit || 0)}`}
            icon="trending-up-outline"
            colors={[colors.orange[500], colors.orange[600]]}
            onPress={navigationHandlers.sales}
          />
        </View>

        {/* Second Row */}
        <View style={styles.cardRow}>
          <NavigationCard
            title="CREDIT SALES"
            subtitle={`${formatCurrency(16000)} outstanding`}
            icon="card-outline"
            colors={[colors.red[500], colors.red[600]]}
            onPress={navigationHandlers.creditSales}
          />
          <NavigationCard
            title="TODAY'S SALES"
            subtitle={`Birr ${stats.todaySales || 0}`}
            icon="trending-up"
            colors={[colors.success, '#38a169']}
            onPress={navigationHandlers.todaysSales}
          />
        </View>
      </View>

      {/* Recent Sales - Optimized rendering */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>RECENT SALES</Text>
        {recentSales.map((sale) => (
          <View key={sale.id} style={styles.saleItem}>
            <View style={styles.saleLeft}>
              <Text style={styles.avatar}>{sale.avatar}</Text>
              <View style={styles.saleInfo}>
                <Text style={styles.customerName}>{sale.customer}</Text>
                <Text style={styles.saleTime}>{sale.time}</Text>
              </View>
            </View>
            <Text style={styles.saleAmount}>+Birr {sale.amount}</Text>
          </View>
        ))}
      </View>

      {/* Quick Actions Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
        {/* <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.quickActionCard} onPress={navigationHandlers.customers}>
            <Ionicons name="people-outline" size={24} color={colors.primary} />
            <Text style={styles.quickActionText}>Customers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard} onPress={navigationHandlers.suppliers}>
            <Ionicons name="business-outline" size={24} color={colors.primary} />
            <Text style={styles.quickActionText}>Suppliers</Text>
          </TouchableOpacity>
        </View> */}
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.quickActionCard} onPress={navigationHandlers.settings}>
            <Ionicons name="settings-outline" size={24} color={colors.primary} />
            <Text style={styles.quickActionText}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard} onPress={navigationHandlers.salesOrder}>
            <Ionicons name="add-circle-outline" size={24} color={colors.success} />
            <Text style={styles.quickActionText}>New Sale</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: spacing.xxl,
    alignItems: "center",
    position: "relative",
  },
  headerContent: {
    alignItems: "center",
    width: "100%",
  },
  headerTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  headerAmount: {
    color: colors.white,
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: spacing.lg,
  },
  refreshButton: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    ...globalStyles.refreshButton,
  },
  headerButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingHorizontal: spacing.xl,
  },
  headerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    minWidth: 80,
    justifyContent: "center",
  },
  headerButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "600",
    marginLeft: spacing.xs,
  },
  sectionHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
  },
  section: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.gray[800],
    marginBottom: spacing.sm,
  },
  navigationGrid: {
    paddingHorizontal: spacing.md,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  navCardContainer: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  navCard: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 80,
  },
  navCardContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  navCardTitle: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: spacing.xs,
  },
  navCardSubtitle: {
    color: colors.white,
    fontSize: 10,
    opacity: 0.9,
    lineHeight: 12,
  },
  saleItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  saleLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    fontSize: 28,
    marginRight: spacing.sm,
  },
  saleInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.gray[800],
    marginBottom: spacing.xs,
  },
  saleTime: {
    fontSize: 13,
    color: colors.gray[600],
  },
  saleAmount: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.success,
  },
  quickActionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: spacing.md,
    marginHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 80,
    ...shadows.sm,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.gray[700],
    marginTop: spacing.xs,
    textAlign: "center",
  },
});

export default MainHomeScreen; 