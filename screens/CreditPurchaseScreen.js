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

const CreditPurchaseScreen = ({ navigation }) => {
  const [creditPurchases, setCreditPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [stats, setStats] = useState({});

  useEffect(() => {
    loadCreditPurchasesData();
  }, []);

  const loadCreditPurchasesData = async () => {
    try {
      const response = await purchasesAPI.getAll({ paymentMethod: 'credit' });
      if (response.data.success) {
        const purchasesData = response.data.data;
        
        // Format purchases data for display
        const formattedPurchases = purchasesData.map(purchase => ({
          ...purchase,
          supplierName: purchase.supplier?.name || purchase.supplier || 'Unknown Supplier',
          status: purchase.remainingAmount > 0 ? 
                  (purchase.paidAmount > 0 ? 'partial' : 'unpaid') : 'paid'
        }));
        
        setCreditPurchases(formattedPurchases);

        // Calculate stats from the data
        const totalCreditPurchases = purchasesData.reduce((sum, purchase) => sum + (purchase.totalAmount || 0), 0);
        const totalOutstanding = purchasesData.reduce((sum, purchase) => sum + (purchase.remainingAmount || 0), 0);
        const uniqueSuppliers = new Set(purchasesData.map(purchase => purchase.supplier?.id || purchase.supplierId)).size;

        setStats({
          totalCreditPurchases,
          totalOutstanding,
          totalSuppliers: uniqueSuppliers,
        });
      } else {
        throw new Error(response.data.message || 'Failed to load credit purchases data');
      }
    } catch (error) {
      console.error("Error loading credit purchases data:", error);
      Alert.alert("Error", "Failed to load credit purchases data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "paid": return colors.success;
      case "partial": return colors.warning;
      case "unpaid": return colors.error;
      default: return colors.gray[500];
    }
  };

  const renderCreditPurchaseItem = ({ item }) => (
    <Card style={styles.creditCard}>
      <View style={styles.creditHeader}>
        <View style={styles.creditInfo}>
          <Text style={styles.supplierName}>{item.supplierName}</Text>
          <Text style={styles.purchaseDate}>{new Date(item.purchaseDate).toLocaleDateString()}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.amountDetails}>
        <Text style={styles.amountText}>Total: {formatCurrency(item.totalAmount)}</Text>
        <Text style={styles.remainingText}>Outstanding: {formatCurrency(item.remainingAmount)}</Text>
      </View>
    </Card>
  );

  return (
    <View style={globalStyles.container}>
      <LinearGradient
        colors={[colors.orange[600], colors.orange[700]]}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Credit Purchases</Text>
        <Text style={styles.headerSubtitle}>
          Outstanding: {formatCurrency(stats.totalOutstanding)}
        </Text>
      </LinearGradient>

      <FlatList
        data={creditPurchases}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderCreditPurchaseItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadCreditPurchasesData} />
        }
      />
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
  creditInfo: {
    flex: 1,
  },
  supplierName: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.gray[800],
    marginBottom: spacing.xs,
  },
  purchaseDate: {
    fontSize: 14,
    color: colors.gray[600],
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
    backgroundColor: colors.gray[50],
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  amountText: {
    fontSize: 14,
    color: colors.gray[800],
    marginBottom: spacing.xs,
  },
  remainingText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.error,
  },
});

export default CreditPurchaseScreen; 