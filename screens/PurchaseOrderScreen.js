import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Card from "../components/Card";
import {
    borderRadius,
    colors,
    formatCurrency,
    globalStyles,
    spacing,
} from "../styles/theme";

const PurchaseOrderScreen = ({ navigation, route }) => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Paid amount state for credit functionality
  const [paidAmount, setPaidAmount] = useState("0");
  
  // Check if we're in create mode and credit mode
  const isCreateMode = route?.params?.createMode || false;
  const isCredit = route?.params?.isCredit || false;

  useEffect(() => {
    if (!isCreateMode) {
      loadPurchaseOrders();
    }
    loadSuppliers();
    loadAvailableItems();
    
    // Open create modal if in create mode
    if (isCreateMode) {
      setShowCreateModal(true);
    }
  }, [isCreateMode]);

  // Update paid amount when total changes or mode changes
  useEffect(() => {
    const total = calculateTotal();
    if (isCredit) {
      setPaidAmount("0");
    } else {
      setPaidAmount(total.toString());
    }
  }, [selectedItems, isCredit]);

  const loadPurchaseOrders = async () => {
    try {
      const mockOrders = [
        {
          id: 1,
          orderNumber: "PO-001",
          supplier: { name: "ABC Suppliers", phone: "+251911111111" },
          totalAmount: 45000,
          status: "delivered",
          createdDate: "2024-01-15",
          expectedDeliveryDate: "2024-01-20",
          deliveredDate: "2024-01-19",
          items: [
            { id: 1, name: "Rice 25kg", quantity: 30, costPrice: 1200, total: 36000 },
            { id: 2, name: "Cooking Oil 1L", quantity: 50, costPrice: 180, total: 9000 }
          ]
        },
        {
          id: 2,
          orderNumber: "PO-002",
          supplier: { name: "XYZ Traders", phone: "+251922222222" },
          totalAmount: 25000,
          status: "pending",
          createdDate: "2024-01-18",
          expectedDeliveryDate: "2024-01-25",
          items: [
            { id: 3, name: "Sugar 1kg", quantity: 100, costPrice: 45, total: 4500 },
            { id: 4, name: "Flour 25kg", quantity: 15, costPrice: 1400, total: 21000 }
          ]
        }
      ];
      setPurchaseOrders(mockOrders);
    } catch (error) {
      console.error("Error loading purchase orders:", error);
    }
  };

  const loadSuppliers = async () => {
    try {
      const mockSuppliers = [
        {
          id: 1,
          name: "ABC Suppliers",
          phone: "+251911111111",
          email: "abc@suppliers.com",
          address: "Addis Ababa, Ethiopia"
        },
        {
          id: 2,
          name: "XYZ Traders",
          phone: "+251922222222",
          email: "xyz@traders.com",
          address: "Dire Dawa, Ethiopia"
        },
        {
          id: 3,
          name: "Best Foods Ltd",
          phone: "+251933333333",
          email: "info@bestfoods.com",
          address: "Hawassa, Ethiopia"
        }
      ];
      setSuppliers(mockSuppliers);
    } catch (error) {
      console.error("Error loading suppliers:", error);
    }
  };

  const loadAvailableItems = async () => {
    try {
      const mockItems = [
        {
          id: 1,
          name: "Rice 25kg",
          sku: "RICE001",
          costPrice: 1200,
          currentStock: 50,
          minStock: 20,
          unit: "bag"
        },
        {
          id: 2,
          name: "Cooking Oil 1L",
          sku: "OIL001",
          costPrice: 180,
          currentStock: 30,
          minStock: 50,
          unit: "bottle"
        },
        {
          id: 3,
          name: "Sugar 1kg",
          sku: "SUG001",
          costPrice: 45,
          currentStock: 100,
          minStock: 80,
          unit: "packet"
        },
        {
          id: 4,
          name: "Flour 25kg",
          sku: "FLOUR001",
          costPrice: 1400,
          currentStock: 25,
          minStock: 40,
          unit: "bag"
        }
      ];
      setAvailableItems(mockItems);
    } catch (error) {
      console.error("Error loading items:", error);
    }
  };

  const addItemToOrder = (item) => {
    const existingItem = selectedItems.find(selected => selected.id === item.id);
    if (existingItem) {
      setSelectedItems(selectedItems.map(selected =>
        selected.id === item.id
          ? { ...selected, quantity: selected.quantity + 1, total: (selected.quantity + 1) * selected.costPrice }
          : selected
      ));
    } else {
      setSelectedItems([...selectedItems, {
        ...item,
        quantity: 1,
        total: item.costPrice
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
        ? { ...item, quantity: quantity, total: quantity * item.costPrice }
        : item
    ));
  };

  const calculateTotal = () => {
    return selectedItems.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateUnpaidAmount = () => {
    const total = calculateTotal();
    const paid = parseFloat(paidAmount) || 0;
    return Math.max(0, total - paid);
  };

  const handlePaidAmountChange = (text) => {
    // Allow only numbers and one decimal point
    const numericValue = text.replace(/[^0-9.]/g, '');
    const parts = numericValue.split('.');
    if (parts.length <= 2) {
      // Limit decimal places to 2
      if (parts[1]) {
        parts[1] = parts[1].substring(0, 2);
      }
      const validValue = parts.join('.');
      setPaidAmount(validValue);
    }
  };

  const createPurchaseOrder = async () => {
    if (!selectedSupplier) {
      Alert.alert("Error", "Please select a supplier");
      return;
    }
    if (selectedItems.length === 0) {
      Alert.alert("Error", "Please add at least one item");
      return;
    }
    if (!expectedDeliveryDate) {
      Alert.alert("Error", "Please set expected delivery date");
      return;
    }

    const total = calculateTotal();
    const paid = parseFloat(paidAmount) || 0;
    
    if (paid > total) {
      Alert.alert("Error", "Paid amount cannot exceed total amount");
      return;
    }

    setLoading(true);
    try {
      const newOrder = {
        id: Date.now(),
        orderNumber: `PO-${String(purchaseOrders.length + 1).padStart(3, '0')}`,
        supplier: selectedSupplier,
        totalAmount: total,
        paidAmount: paid,
        remainingAmount: total - paid,
        status: "pending",
        paymentStatus: paid === 0 ? "unpaid" : paid === total ? "paid" : "partial",
        isCredit: isCredit,
        createdDate: new Date().toISOString().split('T')[0],
        expectedDeliveryDate,
        items: selectedItems,
        notes
      };

      setPurchaseOrders([newOrder, ...purchaseOrders]);
      
      // Reset form
      setSelectedSupplier(null);
      setSelectedItems([]);
      setExpectedDeliveryDate("");
      setNotes("");
      setPaidAmount("0");
      setShowCreateModal(false);
      
      const orderType = isCredit ? "credit purchase order" : "purchase order";
      Alert.alert("Success", `${orderType} ${newOrder.orderNumber} created successfully!`, [
        {
          text: "OK",
          onPress: () => {
            if (isCreateMode) {
              navigation.goBack();
            }
          }
        }
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to create purchase order");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "delivered": return colors.success;
      case "pending": return colors.warning;
      case "cancelled": return colors.error;
      case "received": return colors.info;
      default: return colors.gray[500];
    }
  };

  const markAsReceived = (orderId) => {
    Alert.alert(
      "Mark as Received",
      "Mark this purchase order as received?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Mark Received", 
          onPress: () => {
            setPurchaseOrders(purchaseOrders.map(order =>
              order.id === orderId
                ? { ...order, status: "delivered", deliveredDate: new Date().toISOString().split('T')[0] }
                : order
            ));
            Alert.alert("Success", "Purchase order marked as received");
          }
        }
      ]
    );
  };

  const renderPurchaseOrderItem = ({ item }) => (
    <Card style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>{item.orderNumber}</Text>
          <Text style={styles.supplierName}>{item.supplier.name}</Text>
          <Text style={styles.orderDate}>Created: {item.createdDate}</Text>
          <Text style={styles.deliveryDate}>Expected: {item.expectedDeliveryDate}</Text>
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
          <Ionicons name="call" size={16} color={colors.success} />
          <Text style={styles.actionText}>Call Supplier</Text>
        </TouchableOpacity>
        {item.status === "pending" && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => markAsReceived(item.id)}
          >
            <Ionicons name="checkmark" size={16} color={colors.primary} />
            <Text style={styles.actionText}>Mark Received</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );

  const renderSupplierItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.supplierCard,
        selectedSupplier?.id === item.id && styles.supplierCardSelected
      ]}
      onPress={() => setSelectedSupplier(item)}
    >
      <View style={styles.supplierInfo}>
        <Text style={styles.supplierName}>{item.name}</Text>
        <Text style={styles.supplierPhone}>{item.phone}</Text>
        <Text style={styles.supplierAddress}>{item.address}</Text>
      </View>
      {selectedSupplier?.id === item.id && (
        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
      )}
    </TouchableOpacity>
  );

  const renderAvailableItem = ({ item }) => {
    const needsRestock = item.currentStock <= item.minStock;
    return (
      <TouchableOpacity 
        style={[styles.availableItemCard, needsRestock && styles.lowStockItem]}
        onPress={() => addItemToOrder(item)}
      >
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemPrice}>{formatCurrency(item.costPrice)} per {item.unit}</Text>
          <Text style={[styles.itemStock, needsRestock && styles.lowStockText]}>
            Stock: {item.currentStock} {item.unit} (Min: {item.minStock})
          </Text>
          {needsRestock && (
            <Text style={styles.restockLabel}>NEEDS RESTOCK</Text>
          )}
        </View>
        <Ionicons name="add-circle" size={24} color={colors.primary} />
      </TouchableOpacity>
    );
  };

  const renderSelectedItem = ({ item }) => (
    <View style={styles.selectedItemCard}>
      <View style={styles.selectedItemInfo}>
        <Text style={styles.selectedItemName}>{item.name}</Text>
        <Text style={styles.selectedItemPrice}>{formatCurrency(item.costPrice)} each</Text>
      </View>
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
      <View style={styles.selectedItemTotal}>
        <Text style={styles.totalText}>{formatCurrency(item.total)}</Text>
        <TouchableOpacity onPress={() => removeItemFromOrder(item.id)}>
          <Ionicons name="trash" size={16} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const CreateOrderModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowCreateModal(false)}>
            <Ionicons name="close" size={24} color={colors.gray[600]} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            Create {isCredit ? "Credit " : ""}Purchase Order
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Supplier</Text>
            <FlatList
              data={suppliers}
              renderItem={renderSupplierItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Information</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Expected Delivery Date *</Text>
              <TextInput
                style={styles.input}
                value={expectedDeliveryDate}
                onChangeText={setExpectedDeliveryDate}
                placeholder="YYYY-MM-DD"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Additional notes..."
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {selectedItems.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Information</Text>
              <View style={styles.paymentSummary}>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Total Amount:</Text>
                  <Text style={styles.paymentValue}>{formatCurrency(calculateTotal())}</Text>
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Paid Amount {isCredit ? "(Leave 0 for credit)" : "*"}
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={paidAmount}
                    onChangeText={handlePaidAmountChange}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </View>
                
                {calculateUnpaidAmount() > 0 && (
                  <View style={styles.paymentRow}>
                    <Text style={[styles.paymentLabel, { color: colors.warning }]}>
                      Remaining Amount:
                    </Text>
                    <Text style={[styles.paymentValue, { color: colors.warning }]}>
                      {formatCurrency(calculateUnpaidAmount())}
                    </Text>
                  </View>
                )}
                
                {isCredit && (
                  <View style={styles.creditNote}>
                    <Ionicons name="information-circle" size={16} color={colors.info} />
                    <Text style={styles.creditNoteText}>
                      This will be recorded as a credit purchase
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Items</Text>
            <FlatList
              data={availableItems}
              renderItem={renderAvailableItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          </View>

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
            </View>
          )}

          <TouchableOpacity 
            style={[styles.createButton, loading && styles.createButtonDisabled]}
            onPress={createPurchaseOrder}
            disabled={loading}
          >
            <Text style={styles.createButtonText}>
              {loading ? "Creating..." : "Create Purchase Order"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <View style={globalStyles.container}>
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
        <Text style={styles.headerTitle}>Purchase Orders</Text>
        
        <View style={styles.headerStats}>
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatValue}>{purchaseOrders.length}</Text>
            <Text style={styles.headerStatLabel}>Total Orders</Text>
          </View>
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatValue}>{purchaseOrders.filter(order => order.status === "pending").length}</Text>
            <Text style={styles.headerStatLabel}>Pending</Text>
          </View>
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatValue}>{formatCurrency(purchaseOrders.reduce((sum, order) => sum + order.totalAmount, 0))}</Text>
            <Text style={styles.headerStatLabel}>Total Value</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={20} color={colors.primary} />
          <Text style={styles.filterButtonText}>Filter</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, styles.primaryAction]}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={20} color={colors.white} />
          <Text style={[styles.filterButtonText, { color: colors.white }]}>
            New Order
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={purchaseOrders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPurchaseOrderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <CreateOrderModal />
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
  supplierName: {
    fontSize: 14,
    color: colors.blue[600],
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  orderDate: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  deliveryDate: {
    fontSize: 14,
    color: colors.gray[600],
  },
  orderStatus: {
    alignItems: "flex-end",
  },
  orderAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.blue[600],
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
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.gray[800],
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  section: {
    marginVertical: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.gray[800],
    marginBottom: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
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
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  supplierCard: {
    padding: spacing.md,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
    marginBottom: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  supplierCardSelected: {
    backgroundColor: colors.primary + "20",
    borderColor: colors.primary,
  },
  supplierInfo: {
    flex: 1,
  },
  supplierPhone: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  supplierAddress: {
    fontSize: 12,
    color: colors.gray[500],
  },
  availableItemCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  lowStockItem: {
    backgroundColor: colors.error + "10",
    borderWidth: 1,
    borderColor: colors.error + "30",
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
  itemPrice: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  itemStock: {
    fontSize: 12,
    color: colors.gray[600],
  },
  lowStockText: {
    color: colors.error,
    fontWeight: "600",
  },
  restockLabel: {
    fontSize: 10,
    color: colors.error,
    fontWeight: "bold",
    marginTop: spacing.xs,
  },
  selectedItemCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
    marginBottom: spacing.sm,
  },
  selectedItemInfo: {
    flex: 1,
  },
  selectedItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.gray[800],
    marginBottom: spacing.xs,
  },
  selectedItemPrice: {
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
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: spacing.md,
    minWidth: 30,
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
    fontWeight: "600",
  },
  // Payment styles
  paymentSummary: {
    backgroundColor: colors.gray[50],
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  paymentLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.gray[700],
  },
  paymentValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.primary,
  },
  creditNote: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.info + "10",
    borderRadius: borderRadius.sm,
  },
  creditNoteText: {
    fontSize: 12,
    color: colors.info,
    marginLeft: spacing.xs,
    flex: 1,
  },
});

export default PurchaseOrderScreen; 