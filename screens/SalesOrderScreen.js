import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import Card from "../components/Card";
import {
  borderRadius,
  colors,
  formatCurrency,
  globalStyles,
  spacing,
} from "../styles/theme";

const SalesOrderScreen = ({ navigation, route }) => {
  const [salesOrders, setSalesOrders] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Paid amount state
  const [paidAmount, setPaidAmount] = useState("0");
  

  
  // Price editing state for selected items
  const [editingSelectedItemId, setEditingSelectedItemId] = useState(null);
  const [tempSelectedPrices, setTempSelectedPrices] = useState({});
  
  // Pagination settings
  const itemsPerPage = 3;
  
  // Check if we're in create mode
  const isCreateMode = route?.params?.createMode || false;
  const isCredit = route?.params?.isCredit || false;

  useEffect(() => {
    if (!isCreateMode) {
      loadSalesOrders();
    }
    loadAvailableItems();
  }, [isCreateMode, isCredit]);

  // Update paid amount when total changes or mode changes
  useEffect(() => {
    const total = calculateTotal();
    if (isCredit) {
      setPaidAmount("0");
    } else {
      setPaidAmount(total.toString());
    }
  }, [selectedItems, isCredit]);

  useEffect(() => {
    // Filter items based on search query
    if (searchQuery.trim() === "") {
      setFilteredItems(availableItems);
    } else {
      const filtered = availableItems.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredItems(filtered);
    }
    setCurrentPage(1); // Reset to first page when searching
  }, [searchQuery, availableItems]);



  // Price editing functions for selected items
  const handleSelectedItemPriceEdit = (item) => {
    setEditingSelectedItemId(item.id);
    setTempSelectedPrices({
      ...tempSelectedPrices,
      [item.id]: item.price.toString()
    });
  };

  const handleSelectedItemPriceCancel = (itemId) => {
    setEditingSelectedItemId(null);
    const newTempPrices = { ...tempSelectedPrices };
    delete newTempPrices[itemId];
    setTempSelectedPrices(newTempPrices);
  };

  const handleSelectedItemPriceConfirm = (item) => {
    const newPrice = parseFloat(tempSelectedPrices[item.id]);
    if (isNaN(newPrice) || newPrice < 0) {
      Alert.alert("Error", "Please enter a valid price");
      return;
    }
    
    // Update the selected item with new price
    setSelectedItems(selectedItems.map(selectedItem =>
      selectedItem.id === item.id
        ? {
            ...selectedItem,
            price: newPrice,
            originalPrice: selectedItem.originalPrice || item.price,
            isDiscounted: newPrice !== (selectedItem.originalPrice || item.price),
            total: newPrice * selectedItem.quantity
          }
        : selectedItem
    ));
    
    setEditingSelectedItemId(null);
    const newTempPrices = { ...tempSelectedPrices };
    delete newTempPrices[item.id];
    setTempSelectedPrices(newTempPrices);
  };

  const updateSelectedTempPrice = (itemId, price) => {
    setTempSelectedPrices({
      ...tempSelectedPrices,
      [itemId]: price
    });
  };

  const loadSalesOrders = async () => {
    try {
      // Mock sales orders data
      const mockOrders = [
        {
          id: 1,
          orderNumber: "SO-001",
          customerName: "Ahmed Hassan",
          customerPhone: "+251911234567",
          totalAmount: 7500,
          status: "completed",
          paymentMethod: "cash",
          createdDate: "2024-01-15",
          items: [
            { id: 1, name: "Rice 25kg", quantity: 5, price: 1500, total: 7500 }
          ]
        },
        {
          id: 2,
          orderNumber: "SO-002",
          customerName: "Fatima Ali",
          customerPhone: "+251922345678",
          totalAmount: 4400,
          status: "pending",
          paymentMethod: "card",
          createdDate: "2024-01-16",
          items: [
            { id: 2, name: "Cooking Oil 1L", quantity: 20, price: 220, total: 4400 }
          ]
        }
      ];
      setSalesOrders(mockOrders);
    } catch (error) {
      console.error("Error loading sales orders:", error);
    }
  };

  const loadAvailableItems = async () => {
    try {
      // Mock available items
      const mockItems = [
        {
          id: 1,
          name: "Rice 25kg",
          sku: "RICE001",
          price: 1500,
          currentStock: 50,
          unit: "bag"
        },
        {
          id: 2,
          name: "Cooking Oil 1L",
          sku: "OIL001",
          price: 220,
          currentStock: 30,
          unit: "bottle"
        },
        {
          id: 3,
          name: "Sugar 1kg",
          sku: "SUG001",
          price: 60,
          currentStock: 100,
          unit: "packet"
        },
        {
          id: 4,
          name: "Flour 25kg",
          sku: "FLOUR001",
          price: 1800,
          currentStock: 25,
          unit: "bag"
        },
        {
          id: 5,
          name: "Wheat 50kg",
          sku: "WHEAT001",
          price: 2500,
          currentStock: 15,
          unit: "bag"
        },
        {
          id: 6,
          name: "Cooking Oil 2L",
          sku: "OIL002",
          price: 400,
          currentStock: 20,
          unit: "bottle"
        }
      ];
      setAvailableItems(mockItems);
      setFilteredItems(mockItems);
    } catch (error) {
      console.error("Error loading items:", error);
    }
  };

  const addItemToOrder = (item) => {
    const existingItem = selectedItems.find(selected => selected.id === item.id);
    if (existingItem) {
      setSelectedItems(selectedItems.map(selected =>
        selected.id === item.id
          ? { ...selected, quantity: selected.quantity + 1, total: (selected.quantity + 1) * selected.price }
          : selected
      ));
    } else {
      setSelectedItems([...selectedItems, {
        ...item,
        quantity: 1,
        total: item.price
      }]);
    }
  };

  const removeItemFromOrder = (itemId) => {
    setSelectedItems(selectedItems.filter(item => item.id !== itemId));
  };

  const updateItemQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeItemFromOrder(itemId);
      return;
    }
    setSelectedItems(selectedItems.map(item =>
      item.id === itemId
        ? { ...item, quantity: quantity, total: quantity * item.price }
        : item
    ));
  };

  const calculateTotal = () => {
    return selectedItems.reduce((sum, item) => sum + item.total, 0);
  };

  // Calculate unpaid amount
  const calculateUnpaidAmount = () => {
    const total = calculateTotal();
    const paid = parseFloat(paidAmount) || 0;
    return Math.max(0, total - paid);
  };

  // Validate and handle paid amount changes
  const handlePaidAmountChange = (text) => {
    const numericValue = parseFloat(text) || 0;
    const total = calculateTotal();
    if (numericValue <= total) {
      setPaidAmount(text);
    } else {
      Alert.alert("Error", "Paid amount cannot exceed total amount");
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const createSalesOrder = async () => {
    // Validate inputs
    if (!customerName.trim() || !customerPhone.trim()) {
      Alert.alert("Error", "Please fill in all customer information fields");
      return;
    }

    if (selectedItems.length === 0) {
      Alert.alert("Error", "Please add at least one item to the order");
      return;
    }

    // Validate paid amount
    const paidAmountNum = parseFloat(paidAmount) || 0;
    const total = calculateTotal();
    if (paidAmountNum < 0) {
      Alert.alert("Error", "Paid amount cannot be negative");
      return;
    }
    if (paidAmountNum > total) {
      Alert.alert("Error", "Paid amount cannot exceed total amount");
      return;
    }

    setLoading(true);
    try {
      const total = calculateTotal();
      const paid = parseFloat(paidAmount) || 0;
      const unpaid = calculateUnpaidAmount();
      
      const orderData = {
        id: Date.now(),
        orderNumber: `SO-${String(salesOrders.length + 1).padStart(3, '0')}`,
        customerName,
        customerPhone,
        items: selectedItems,
        totalAmount: total,
        paidAmount: paid,
        unpaidAmount: unpaid,
        status: unpaid > 0 ? "pending" : "completed",
        paymentMethod: isCredit ? "credit" : "cash",
        createdDate: new Date().toISOString().split('T')[0],
      };

      setSalesOrders([orderData, ...salesOrders]);
      
      // Reset form
      setCustomerName("");
      setCustomerPhone("");
      setSelectedItems([]);
      setPaidAmount(isCredit ? "0" : "");
      setSearchQuery("");
      setCurrentPage(1);
      setEditingSelectedItemId(null);
      setTempSelectedPrices({});
      
      const orderType = isCredit ? "credit sales order" : "sales order";
      Alert.alert("Success", `${orderData.orderNumber} ${orderType} created successfully!`, [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to create sales order");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed": return colors.success;
      case "pending": return colors.warning;
      case "cancelled": return colors.error;
      default: return colors.gray[500];
    }
  };

  const renderAvailableItem = ({ item }) => {
    return (
      <Card style={styles.itemCard}>
        <View style={styles.itemRow}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            <View style={styles.itemPriceRow}>
              <Text style={styles.itemStockText}>
                Stock: {item.currentStock} {item.unit}
              </Text>
              <Text style={styles.itemPriceText}>
                {formatCurrency(item.price)}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => addItemToOrder(item)}
          >
            <Ionicons name="add" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  const renderSelectedItem = ({ item }) => {
    const isEditingSelected = editingSelectedItemId === item.id;
    const tempSelectedPrice = tempSelectedPrices[item.id] || item.price.toString();
    
    return (
      <Card style={styles.selectedItemCard}>
        <View style={styles.selectedItemRow}>
          <View style={styles.selectedItemInfo}>
            <View style={styles.selectedItemHeader}>
              <Text style={styles.selectedItemName}>{item.name}</Text>
              {item.isDiscounted && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>
                    {((item.originalPrice - item.price) / item.originalPrice * 100).toFixed(0)}% OFF
                  </Text>
                </View>
              )}
            </View>
            
            {!isEditingSelected ? (
              <View style={styles.selectedItemPriceContainer}>
                <Text style={styles.selectedItemPrice}>
                  {formatCurrency(item.price)} each
                </Text>
                <TouchableOpacity 
                  style={styles.editSelectedPriceButton}
                  onPress={() => handleSelectedItemPriceEdit(item)}
                >
                  <Ionicons name="create-outline" size={14} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.selectedPriceEditContainer}>
                <TextInput
                  style={styles.selectedPriceInput}
                  value={tempSelectedPrice}
                  onChangeText={(text) => updateSelectedTempPrice(item.id, text)}
                  keyboardType="numeric"
                  placeholder="Price"
                  autoFocus
                />
                <View style={styles.selectedPriceEditButtons}>
                  <TouchableOpacity 
                    style={styles.selectedPriceEditButton}
                    onPress={() => handleSelectedItemPriceConfirm(item)}
                  >
                    <Ionicons name="checkmark" size={14} color={colors.success} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.selectedPriceEditButton}
                    onPress={() => handleSelectedItemPriceCancel(item.id)}
                  >
                    <Ionicons name="close" size={14} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            {item.isDiscounted && (
              <Text style={styles.originalPriceText}>
                Original: {formatCurrency(item.originalPrice)}
              </Text>
            )}
          </View>
          
          {!isEditingSelected && (
            <View style={styles.quantityControls}>
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={() => updateItemQuantity(item.id, item.quantity - 1)}
              >
                <Ionicons name="remove" size={16} color={colors.white} />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{item.quantity}</Text>
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={() => updateItemQuantity(item.id, item.quantity + 1)}
              >
                <Ionicons name="add" size={16} color={colors.white} />
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.selectedItemTotal}>
            <Text style={styles.totalText}>{formatCurrency(item.total)}</Text>
            {item.isDiscounted && (
              <Text style={styles.savingsText}>
                Save {formatCurrency((item.originalPrice - item.price) * item.quantity)}
              </Text>
            )}
            {!isEditingSelected && (
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => removeItemFromOrder(item.id)}
              >
                <Ionicons name="trash" size={14} color={colors.error} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Card>
    );
  };

  const renderSalesOrderItem = ({ item }) => (
    <Card style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>{item.orderNumber}</Text>
          <Text style={styles.customerName}>{item.customerName}</Text>
          <Text style={styles.orderDate}>{item.createdDate}</Text>
        </View>
        <View style={styles.orderStatus}>
          <Text style={styles.orderAmount}>{formatCurrency(item.totalAmount)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.orderDetails}>
        <Text style={styles.itemsTitle}>Items ({item.items.length}):</Text>
        {item.items.map((orderItem, index) => (
          <Text key={index} style={styles.itemText}>
            {orderItem.quantity}x {orderItem.name} - {formatCurrency(orderItem.total)}
          </Text>
        ))}
      </View>
      
      <View style={styles.orderActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="eye" size={16} color={colors.info} />
          <Text style={styles.actionText}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="receipt" size={16} color={colors.success} />
          <Text style={styles.actionText}>Receipt</Text>
        </TouchableOpacity>
        {item.status === "pending" && (
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="checkmark" size={16} color={colors.primary} />
            <Text style={styles.actionText}>Complete</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );

  // Create Sales Order Page
  if (isCreateMode) {
    return (
      <KeyboardAvoidingView 
        style={globalStyles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* Header */}
        <LinearGradient
          colors={[colors.orange[600], colors.orange[700]]}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={30} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isCredit ? "Create Credit Sales Order" : "Create Sales Order"}
          </Text>
        </LinearGradient>

        <ScrollView 
          style={styles.createContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Customer Information */}
          <Card style={styles.customerCard}>
            {/* <Text style={styles.sectionTitle}>Add Customer</Text> */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Customer Name *</Text>
              <TextInput
                style={styles.input}
                value={customerName}
                onChangeText={setCustomerName}
                placeholder="Enter customer name"
              />
            </View>
            <View style={styles.inputGroup}>
              {/* <Text style={styles.inputLabel}>Phone Number</Text> */}
              <TextInput
                style={styles.input}
                value={customerPhone}
                onChangeText={setCustomerPhone}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
              />
            </View>
          </Card>



          {/* Available Items with Search */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Available Items</Text>
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={colors.gray[400]} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search items..."
                  placeholderTextColor={colors.gray[400]}
                />
              </View>
            </View>
            
            <FlatList
              data={paginatedItems}
              renderItem={renderAvailableItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              ListEmptyComponent={
                <Text style={styles.noItemsText}>No items found</Text>
              }
            />
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
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
                  <Text style={styles.paginationCount}>
                    {filteredItems.length} items total
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
            )}
          </View>

          {/* Selected Items */}
          {selectedItems.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Selected Items</Text>
              <FlatList
                data={selectedItems}
                renderItem={renderSelectedItem}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
              />
              <View style={styles.totalSection}>
                <Text style={styles.totalLabel}>Total Amount:</Text>
                <Text style={styles.totalAmount}>{formatCurrency(calculateTotal())}</Text>
              </View>
              
              {/* Paid Amount - Editable */}
              <View style={styles.paidAmountSection}>
                <Text style={styles.paidAmountLabel}>
                  {isCredit ? "Paid Amount (Credit Sale):" : "Paid Amount:"}
                </Text>
                <TextInput
                  style={styles.paidAmountInput}
                  value={paidAmount}
                  onChangeText={handlePaidAmountChange}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
              
              {/* Credit Sales Summary */}
              {isCredit && calculateUnpaidAmount() > 0 && (
                <View style={styles.creditSummarySection}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Unpaid Amount:</Text>
                    <Text style={styles.unpaidAmount}>{formatCurrency(calculateUnpaidAmount())}</Text>
                  </View>
                </View>
              )}
            </View>
          )}

          <TouchableOpacity 
            style={[styles.createButton, loading && styles.createButtonDisabled]}
            onPress={createSalesOrder}
            disabled={loading}
          >
            <Text style={styles.createButtonText}>
              {loading ? "Creating..." : "Create Sales Order"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Sales Orders List Page
  return (
    <View style={globalStyles.container}>
      {/* Header */}
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
        <Text style={styles.headerTitle}>Sales Orders</Text>
        
        {/* Integrated Stats in Header */}
        <View style={styles.headerStats}>
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatValue}>{salesOrders.length}</Text>
            <Text style={styles.headerStatLabel}>Total Orders</Text>
          </View>
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatValue}>
              {formatCurrency(salesOrders.reduce((sum, order) => sum + order.totalAmount, 0))}
            </Text>
            <Text style={styles.headerStatLabel}>Total Value</Text>
          </View>
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatValue}>
              {salesOrders.filter(order => order.status === "pending").length}
            </Text>
            <Text style={styles.headerStatLabel}>Pending</Text>
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
          style={[styles.filterButton, styles.primaryAction]}
          onPress={() => navigation.navigate("SalesOrder", { createMode: true })}
        >
          <Ionicons name="add" size={20} color={colors.white} />
          <Text style={[styles.filterButtonText, { color: colors.white }]}>
            New Order
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sales Orders List */}
      <FlatList
        data={salesOrders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderSalesOrderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
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
    fontSize: 20,
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
  orderCard: {
    marginBottom: spacing.md,
  },
  orderHeader: {
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
  customerName: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  orderDate: {
    fontSize: 14,
    color: colors.gray[600],
  },
  orderStatus: {
    alignItems: "flex-end",
  },
  orderAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.green[600],
    marginBottom: spacing.xs,
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
  orderDetails: {
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    paddingTop: spacing.md,
    marginBottom: spacing.md,
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  itemText: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  orderActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    paddingTop: spacing.md,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
  },
  actionText: {
    fontSize: 14,
    marginLeft: spacing.xs,
    color: colors.gray[700],
  },
  
  // Create page specific styles
  createContainer: {
    flex: 1,
    padding: spacing.sm,
  },
  customerCard: {
    marginBottom: spacing.sm,
  },
  paymentCard: {
    marginBottom: spacing.sm,
  },
  inputGroup: {
    marginBottom: spacing.sm,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.gray[700],
    marginBottom: spacing.xs,
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
  
  // Search styles
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.gray[800],
  },
  
  // Item styles - optimized for space
  itemCard: {
    marginBottom: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.gray[800],
    marginBottom: spacing.xs,
  },
  itemPriceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemStockText: {
    fontSize: 14,
    color: colors.gray[600],
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemPriceText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.gray[800],
    marginHorizontal: spacing.sm,
  },
  editPriceButton: {
    padding: spacing.xs,
  },
  priceEditContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  priceInput: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    backgroundColor: colors.white,
  },
  priceEditButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  priceEditButton: {
    padding: spacing.xs,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  noItemsText: {
    textAlign: "center",
    color: colors.gray[500],
    fontSize: 16,
    paddingVertical: spacing.lg,
  },
  
  // Pagination styles
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.md,
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  paginationButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[50],
    minHeight: 44,
    minWidth: 80,
  },
  paginationButtonDisabled: {
    backgroundColor: colors.gray[100],
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
    marginHorizontal: spacing.xs,
  },
  paginationButtonTextDisabled: {
    color: colors.gray[400],
  },
  paginationInfo: {
    alignItems: "center",
  },
  paginationText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.gray[700],
  },
  paginationCount: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  
  // Selected item styles
  selectedItemCard: {
    marginBottom: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  selectedItemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    minHeight: 60,
  },
  selectedItemInfo: {
    flex: 1,
  },
  selectedItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  selectedItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.gray[800],
    marginBottom: spacing.xs,
  },
  selectedItemPriceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectedItemPrice: {
    fontSize: 16,
    color: colors.gray[600],
  },
  discountBadge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.warning,
    marginLeft: spacing.sm,
  },
  discountText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.white,
  },
  originalPriceText: {
    fontSize: 12,
    color: colors.gray[600],
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.md,
  },
  quantityButton: {
    backgroundColor: colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: spacing.sm,
    minWidth: 24,
    textAlign: "center",
  },
  selectedItemTotal: {
    alignItems: "center",
  },
  totalText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  removeButton: {
    padding: spacing.xs,
  },
  totalSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.gray[800],
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primary,
  },
  paidAmountSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  paidAmountLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.gray[800],
    flex: 1,
  },
  paidAmountInput: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    backgroundColor: colors.white,
    textAlign: "right",
    fontWeight: "600",
    color: colors.primary,
    minWidth: 120,
  },
  savingsText: {
    fontSize: 12,
    color: colors.green[600],
  },
  createButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
    marginVertical: spacing.lg,
  },
  createButtonDisabled: {
    backgroundColor: colors.gray[400],
  },
  createButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "400",
  },
  editSelectedPriceButton: {
    padding: spacing.xs,
  },
  selectedPriceEditContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingVertical: spacing.sm,
  },
  selectedPriceInput: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    backgroundColor: colors.white,
    flex: 1,
    marginRight: spacing.sm,
    minWidth: 80,
  },
  selectedPriceEditButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  selectedPriceEditButton: {
    padding: spacing.sm,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    minWidth: 36,
    minHeight: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  helperText: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  creditSummarySection: {
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.gray[700],
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.primary,
  },
  unpaidAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.error,
  },
  section: {
    marginVertical: spacing.md,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.gray[800],
    marginBottom: spacing.md,
  },
});

export default SalesOrderScreen; 