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
    View,
} from "react-native";
import Card from "../components/Card";
import { itemsAPI } from "../services/api";
import {
    borderRadius,
    colors,
    formatCurrency,
    globalStyles,
    spacing,
} from "../styles/theme";

const LowStockScreen = ({ navigation }) => {
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLowStockItems();
  }, []);

  const loadLowStockItems = async () => {
    try {
      const response = await itemsAPI.getLowStock();
      if (response.data.success) {
        const items = response.data.data.map(item => ({
          ...item,
          priority: item.currentStock === 0 ? "critical" :
                   item.currentStock <= item.minStock * 0.5 ? "high" : "medium"
        }));
        setLowStockItems(items);
      } else {
        throw new Error(response.data.message || 'Failed to load low stock items');
      }
    } catch (error) {
      console.error("Error loading low stock items:", error);
      Alert.alert("Error", "Failed to load low stock items");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLowStockItems();
    setRefreshing(false);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "critical":
        return colors.error;
      case "high":
        return colors.orange[500];
      case "medium":
        return colors.warning;
      default:
        return colors.gray[500];
    }
  };

  const handleRestockItem = (item) => {
    Alert.alert(
      "Restock Item",
      `Do you want to restock ${item.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restock",
          onPress: () => {
            Alert.alert("Success", `${item.name} has been added to restock list`);
          },
        },
      ]
    );
  };

  const renderLowStockItem = ({ item }) => (
    <Card style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemCategory}>{item.category}</Text>
        </View>
        <View style={styles.priorityBadge}>
          <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(item.priority) }]} />
          <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
            {item.priority.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.stockInfo}>
        <View style={styles.stockRow}>
          <Text style={styles.stockLabel}>Current Stock:</Text>
          <Text style={[styles.stockValue, { color: colors.error }]}>
            {item.currentStock} {item.unit}
          </Text>
        </View>
        <View style={styles.stockRow}>
          <Text style={styles.stockLabel}>Minimum Stock:</Text>
          <Text style={styles.stockValue}>
            {item.minStock} {item.unit}
          </Text>
        </View>
        <View style={styles.stockRow}>
          <Text style={styles.stockLabel}>Unit Price:</Text>
          <Text style={styles.stockValue}>
            {formatCurrency(item.price)}
          </Text>
        </View>
      </View>

      <View style={styles.itemFooter}>
        <View style={styles.supplierInfo}>
          <Text style={styles.supplierLabel}>Supplier:</Text>
          <Text style={styles.supplierName}>{item.supplier}</Text>
        </View>
        <TouchableOpacity
          style={styles.restockButton}
          onPress={() => handleRestockItem(item)}
        >
          <Ionicons name="add-circle" size={20} color={colors.white} />
          <Text style={styles.restockButtonText}>Restock</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="checkmark-circle" size={80} color={colors.success} />
      <Text style={styles.emptyTitle}>All Items Well Stocked!</Text>
      <Text style={styles.emptySubtitle}>
        No items are currently running low on stock.
      </Text>
    </View>
  );

  return (
    <View style={globalStyles.container}>
      {/* Header */}
      <LinearGradient
        colors={[colors.error, '#e53e3e']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Low Stock Items</Text>
        <View style={styles.headerStats}>
          <Text style={styles.statsText}>
            {lowStockItems.length} items need attention
          </Text>
        </View>
      </LinearGradient>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="filter" size={20} color={colors.primary} />
          <Text style={styles.actionButtonText}>Filter</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="download" size={20} color={colors.primary} />
          <Text style={styles.actionButtonText}>Export</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.primaryAction]}
          onPress={() => navigation.navigate("Items")}
        >
          <Ionicons name="add" size={20} color={colors.white} />
          <Text style={[styles.actionButtonText, { color: colors.white }]}>
            Add Stock
          </Text>
        </TouchableOpacity>
      </View>

      {/* Items List */}
      <FlatList
        data={lowStockItems}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderLowStockItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
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
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    alignSelf: "flex-start",
  },
  statsText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
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
  listContainer: {
    padding: spacing.md,
  },
  itemCard: {
    marginBottom: spacing.md,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.gray[800],
    marginBottom: spacing.xs,
  },
  itemCategory: {
    fontSize: 14,
    color: colors.gray[600],
  },
  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gray[100],
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: "600",
  },
  stockInfo: {
    backgroundColor: colors.gray[50],
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  stockRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  stockLabel: {
    fontSize: 14,
    color: colors.gray[600],
  },
  stockValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.gray[800],
  },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  supplierInfo: {
    flex: 1,
  },
  supplierLabel: {
    fontSize: 12,
    color: colors.gray[500],
    marginBottom: spacing.xs,
  },
  supplierName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.gray[700],
  },
  restockButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  restockButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: spacing.xs,
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
  },
});

export default LowStockScreen; 