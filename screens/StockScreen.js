import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
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

const StockScreen = ({ navigation }) => {
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [adjustmentQuantity, setAdjustmentQuantity] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  
  const [newItem, setNewItem] = useState({
    name: "",
    category: "",
    unit: "",
    minStock: "",
    maxStock: "",
    price: "",
    supplier: "",
  });

  useEffect(() => {
    loadStockData();
  }, []);

  const loadStockData = async () => {
    try {
      const response = await itemsAPI.getAll();
      if (response.data.success) {
        const items = response.data.data.map(item => ({
          ...item,
          stockValue: item.currentStock * item.costPrice,
          status: item.currentStock <= item.minStock ? "low" : 
                  item.currentStock >= item.maxStock * 0.9 ? "high" : "good"
        }));
        setStockItems(items);
      } else {
        throw new Error(response.data.message || 'Failed to load stock data');
      }
    } catch (error) {
      console.error("Error loading stock data:", error);
      Alert.alert("Error", "Failed to load stock data");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStockData();
    setRefreshing(false);
  };

  const getStockStatus = (item) => {
    if (item.currentStock <= item.minStock) return "low";
    if (item.currentStock >= item.maxStock * 0.9) return "high";
    return "good";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "low":
        return colors.error;
      case "high":
        return colors.warning;
      case "good":
        return colors.success;
      default:
        return colors.gray[500];
    }
  };

  const getStockPercentage = (item) => {
    return Math.round((item.currentStock / item.maxStock) * 100);
  };

  const handleStockAdjustment = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
    setAdjustmentQuantity("");
    setAdjustmentReason("");
  };

  const submitStockAdjustment = () => {
    if (!adjustmentQuantity || !adjustmentReason) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    const quantity = parseInt(adjustmentQuantity);
    if (isNaN(quantity)) {
      Alert.alert("Error", "Please enter a valid quantity");
      return;
    }

    // Update stock
    const updatedItems = stockItems.map(item =>
      item.id === selectedItem.id
        ? { ...item, currentStock: Math.max(0, item.currentStock + quantity) }
        : item
    );
    setStockItems(updatedItems);
    
    closeAdjustmentModal();
    Alert.alert("Success", "Stock adjustment recorded successfully");
  };

  const closeAdjustmentModal = () => {
    setModalVisible(false);
    setAdjustmentQuantity("");
    setAdjustmentReason("");
    setSelectedItem(null);
  };

  const handleAddItem = async () => {
    try {
      if (!newItem.name.trim() || !newItem.category.trim() || !newItem.unit.trim()) {
        Alert.alert("Error", "Please fill in all required fields");
        return;
      }

      const itemData = {
        ...newItem,
        id: Date.now(),
        currentStock: 0,
        minStock: parseInt(newItem.minStock) || 0,
        maxStock: parseInt(newItem.maxStock) || 100,
        price: parseFloat(newItem.price) || 0,
        lastRestocked: new Date().toISOString().split('T')[0],
        stockValue: 0,
        status: "good",
      };

      setStockItems([...stockItems, itemData]);
      
      Alert.alert("Success", "Item added successfully");
      closeAddItemModal();
    } catch (error) {
      console.error("Error adding item:", error);
      Alert.alert("Error", "Failed to add item");
    }
  };

  const closeAddItemModal = () => {
    setShowAddItemModal(false);
    setNewItem({
      name: "",
      category: "",
      unit: "",
      minStock: "",
      maxStock: "",
      price: "",
      supplier: "",
    });
  };

  const renderStockItem = ({ item }) => {
    const status = getStockStatus(item);
    const percentage = getStockPercentage(item);
    
    return (
      <Card style={styles.itemCard}>
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemCategory}>{item.category}</Text>
          </View>
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
              {status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Stock Level Bar */}
        <View style={styles.stockLevelContainer}>
          <View style={styles.stockLevelBar}>
            <View 
              style={[
                styles.stockLevelFill, 
                { width: `${percentage}%`, backgroundColor: getStatusColor(status) }
              ]} 
            />
          </View>
          <Text style={styles.stockPercentage}>{percentage}%</Text>
        </View>

        <View style={styles.stockDetails}>
          <View style={styles.stockRow}>
            <Text style={styles.stockLabel}>Current Stock:</Text>
            <Text style={[styles.stockValue, { color: getStatusColor(status) }]}>
              {item.currentStock} {item.unit}
            </Text>
          </View>
          <View style={styles.stockRow}>
            <Text style={styles.stockLabel}>Min / Max:</Text>
            <Text style={styles.stockValue}>
              {item.minStock} / {item.maxStock} {item.unit}
            </Text>
          </View>
          <View style={styles.stockRow}>
            <Text style={styles.stockLabel}>Stock Value:</Text>
            <Text style={styles.stockValue}>
              {formatCurrency(item.stockValue)}
            </Text>
          </View>
        </View>

        <View style={styles.itemActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleStockAdjustment(item)}
          >
            <Ionicons name="create" size={18} color={colors.primary} />
            <Text style={styles.actionButtonText}>Adjust</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate("Items", { selectedItem: item })}
          >
            <Ionicons name="information-circle" size={18} color={colors.primary} />
            <Text style={styles.actionButtonText}>Details</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  const totalStockValue = stockItems.reduce((sum, item) => sum + item.stockValue, 0);
  const lowStockCount = stockItems.filter(item => getStockStatus(item) === "low").length;

  // Pagination logic
  const totalPages = Math.ceil(stockItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = stockItems.slice(startIndex, endIndex);

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
          {stockItems.length} total items
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
        <Text style={styles.headerTitle}>Stock Management</Text>
        
        {/* Integrated Stats in Header */}
        <View style={styles.headerStats}>
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatValue}>{stockItems.length}</Text>
            <Text style={styles.headerStatLabel}>Total Items</Text>
          </View>
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatValue}>{lowStockCount}</Text>
            <Text style={styles.headerStatLabel}>Low Stock</Text>
          </View>
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatValue}>{formatCurrency(totalStockValue)}</Text>
            <Text style={styles.headerStatLabel}>Total Value</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={20} color={colors.primary} />
          <Text style={styles.filterButtonText}>Filter</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => navigation.navigate("LowStock")}
        >
          <Ionicons name="warning" size={20} color={colors.warning} />
          <Text style={styles.filterButtonText}>Low Stock</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, styles.primaryAction]}
          onPress={() => setShowAddItemModal(true)}
        >
          <Ionicons name="add" size={20} color={colors.white} />
          <Text style={[styles.filterButtonText, { color: colors.white }]}>
            Add Item
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stock Items List */}
      <FlatList
        data={paginatedItems}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderStockItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Pagination Controls */}
      {totalPages > 1 && renderPaginationControls()}

      {/* Add Item Modal */}
      <Modal
        visible={showAddItemModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeAddItemModal}>
              <Ionicons name="close" size={24} color={colors.gray[600]} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add New Item</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Item Name *</Text>
              <TextInput
                style={styles.input}
                value={newItem.name}
                onChangeText={(text) => setNewItem({ ...newItem, name: text })}
                placeholder="Enter item name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category *</Text>
              <TextInput
                style={styles.input}
                value={newItem.category}
                onChangeText={(text) => setNewItem({ ...newItem, category: text })}
                placeholder="Enter category"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Unit *</Text>
              <TextInput
                style={styles.input}
                value={newItem.unit}
                onChangeText={(text) => setNewItem({ ...newItem, unit: text })}
                placeholder="e.g., kg, liters, pieces"
              />
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Min Stock</Text>
                <TextInput
                  style={styles.input}
                  value={newItem.minStock}
                  onChangeText={(text) => setNewItem({ ...newItem, minStock: text })}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Max Stock</Text>
                <TextInput
                  style={styles.input}
                  value={newItem.maxStock}
                  onChangeText={(text) => setNewItem({ ...newItem, maxStock: text })}
                  placeholder="100"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Price per Unit</Text>
              <TextInput
                style={styles.input}
                value={newItem.price}
                onChangeText={(text) => setNewItem({ ...newItem, price: text })}
                placeholder="0.00"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Supplier</Text>
              <TextInput
                style={styles.input}
                value={newItem.supplier}
                onChangeText={(text) => setNewItem({ ...newItem, supplier: text })}
                placeholder="Enter supplier name"
              />
            </View>

            <TouchableOpacity 
              style={styles.createButton}
              onPress={handleAddItem}
            >
              <Text style={styles.createButtonText}>Add Item</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Stock Adjustment Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adjust Stock</Text>
              <TouchableOpacity onPress={closeAdjustmentModal}>
                <Ionicons name="close" size={24} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>

            {selectedItem && (
              <View style={styles.modalBody}>
                <Text style={styles.itemNameModal}>{selectedItem.name}</Text>
                <Text style={styles.currentStockModal}>
                  Current Stock: {selectedItem.currentStock} {selectedItem.unit}
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Adjustment Quantity</Text>
                  <TextInput
                    style={styles.textInput}
                    value={adjustmentQuantity}
                    onChangeText={setAdjustmentQuantity}
                    placeholder="Enter quantity (+ to add, - to remove)"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Reason</Text>
                  <TextInput
                    style={styles.textInput}
                    value={adjustmentReason}
                    onChangeText={setAdjustmentReason}
                    placeholder="Enter reason for adjustment"
                    multiline
                  />
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.saveButton}
                    onPress={submitStockAdjustment}
                  >
                    <Text style={styles.saveButtonText}>Save Adjustment</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
  stockLevelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  stockLevelBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.gray[200],
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  stockLevelFill: {
    height: "100%",
    borderRadius: 4,
  },
  stockPercentage: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.gray[600],
    minWidth: 35,
  },
  stockDetails: {
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
  itemActions: {
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
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    margin: spacing.lg,
    width: "90%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.gray[800],
  },
  modalBody: {
    marginBottom: spacing.lg,
  },
  itemNameModal: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.gray[800],
    marginBottom: spacing.xs,
  },
  currentStockModal: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.gray[800],
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray[300],
    marginRight: spacing.sm,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.gray[700],
  },
  saveButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    backgroundColor: colors.white,
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  inputHalf: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  createButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
    marginVertical: spacing.lg,
  },
  createButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
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

export default StockScreen; 