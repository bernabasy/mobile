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
    spacing
} from "../styles/theme";

const ShopScreen = ({ navigation }) => {
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showStockReportModal, setShowStockReportModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newShop, setNewShop] = useState({
    name: "",
    location: "",
    manager: "",
    phone: "",
    email: "",
    address: "",
  });
  const [transferData, setTransferData] = useState({
    fromShop: null,
    toShop: null,
    selectedItems: [],
  });
  const [availableItems, setAvailableItems] = useState([]);

  useEffect(() => {
    loadShops();
    loadAvailableItems();
  }, []);

  const loadShops = async () => {
    try {
      setLoading(true);
      // Mock shops data
      const mockShops = [
        {
          id: 1,
          name: "Main Store",
          location: "Addis Ababa Central",
          manager: "Ahmed Hassan",
          phone: "+251911234567",
          email: "ahmed@arifsales.com",
          address: "Bole Road, Addis Ababa",
          totalStock: 1250,
          totalValue: 185000,
          lowStockItems: 5,
          status: "active",
          createdDate: "2024-01-01",
          inventory: [
            { itemId: 1, name: "Rice 25kg", quantity: 45, value: 67500 },
            { itemId: 2, name: "Cooking Oil 1L", quantity: 30, value: 6600 },
            { itemId: 3, name: "Sugar 1kg", quantity: 80, value: 4800 },
          ]
        },
        {
          id: 2,
          name: "Branch Store",
          location: "Hawassa",
          manager: "Fatima Ali",
          phone: "+251922345678",
          email: "fatima@arifsales.com",
          address: "Tabor Subcity, Hawassa",
          totalStock: 850,
          totalValue: 125000,
          lowStockItems: 3,
          status: "active",
          createdDate: "2024-01-15",
          inventory: [
            { itemId: 1, name: "Rice 25kg", quantity: 25, value: 37500 },
            { itemId: 2, name: "Cooking Oil 1L", quantity: 20, value: 4400 },
            { itemId: 4, name: "Flour 25kg", quantity: 15, value: 27000 },
          ]
        },
        {
          id: 3,
          name: "Warehouse",
          location: "Dire Dawa",
          manager: "Mohammed Omar",
          phone: "+251933456789",
          email: "mohammed@arifsales.com",
          address: "Industrial Zone, Dire Dawa",
          totalStock: 2500,
          totalValue: 450000,
          lowStockItems: 2,
          status: "active",
          createdDate: "2024-01-10",
          inventory: [
            { itemId: 1, name: "Rice 25kg", quantity: 100, value: 150000 },
            { itemId: 2, name: "Cooking Oil 1L", quantity: 200, value: 44000 },
            { itemId: 3, name: "Sugar 1kg", quantity: 300, value: 18000 },
            { itemId: 4, name: "Flour 25kg", quantity: 50, value: 90000 },
          ]
        }
      ];
      setShops(mockShops);
    } catch (error) {
      console.error("Error loading shops:", error);
      Alert.alert("Error", "Failed to load shops");
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableItems = async () => {
    try {
      const mockItems = [
        { id: 1, name: "Rice 25kg", price: 1500, unit: "bag" },
        { id: 2, name: "Cooking Oil 1L", price: 220, unit: "bottle" },
        { id: 3, name: "Sugar 1kg", price: 60, unit: "packet" },
        { id: 4, name: "Flour 25kg", price: 1800, unit: "bag" },
      ];
      setAvailableItems(mockItems);
    } catch (error) {
      console.error("Error loading items:", error);
    }
  };

  const handleAddShop = async () => {
    try {
      if (!newShop.name.trim() || !newShop.location.trim() || !newShop.manager.trim()) {
        Alert.alert("Error", "Please fill in all required fields");
        return;
      }

      const shopData = {
        ...newShop,
        id: Date.now(),
        totalStock: 0,
        totalValue: 0,
        lowStockItems: 0,
        status: "active",
        createdDate: new Date().toISOString().split('T')[0],
        inventory: []
      };

      setShops([...shops, shopData]);
      
      Alert.alert("Success", "Shop created successfully");
      setShowAddModal(false);
      setNewShop({
        name: "",
        location: "",
        manager: "",
        phone: "",
        email: "",
        address: "",
      });
    } catch (error) {
      console.error("Error adding shop:", error);
      Alert.alert("Error", "Failed to create shop");
    }
  };

  const handleTransfer = () => {
    if (!transferData.fromShop || !transferData.toShop) {
      Alert.alert("Error", "Please select both source and destination shops");
      return;
    }
    if (transferData.fromShop.id === transferData.toShop.id) {
      Alert.alert("Error", "Source and destination shops cannot be the same");
      return;
    }
    if (transferData.selectedItems.length === 0) {
      Alert.alert("Error", "Please select at least one item to transfer");
      return;
    }
    
    Alert.alert("Success", `Transfer initiated: ${transferData.selectedItems.length} items from ${transferData.fromShop.name} to ${transferData.toShop.name}`);
    setShowTransferModal(false);
    setTransferData({ fromShop: null, toShop: null, selectedItems: [] });
  };

  const toggleItemSelection = (item, quantity) => {
    const existingIndex = transferData.selectedItems.findIndex(selected => selected.id === item.id);
    
    if (existingIndex >= 0) {
      // Remove item if quantity is 0 or update quantity
      const updatedItems = [...transferData.selectedItems];
      if (quantity <= 0) {
        updatedItems.splice(existingIndex, 1);
      } else {
        updatedItems[existingIndex] = { ...item, transferQuantity: quantity };
      }
      setTransferData({ ...transferData, selectedItems: updatedItems });
    } else if (quantity > 0) {
      // Add new item
      setTransferData({ 
        ...transferData, 
        selectedItems: [...transferData.selectedItems, { ...item, transferQuantity: quantity }]
      });
    }
  };

  const generateStockReport = (shop) => {
    setSelectedShop(shop);
    setShowStockReportModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active": return colors.success;
      case "inactive": return colors.error;
      case "maintenance": return colors.warning;
      default: return colors.gray[500];
    }
  };

  const renderShopItem = ({ item }) => (
    <Card style={styles.shopCard}>
      <View style={styles.shopHeader}>
        <View style={styles.shopInfo}>
          <Text style={styles.shopName}>{item.name}</Text>
          <Text style={styles.shopLocation}>📍 {item.location}</Text>
          <Text style={styles.shopManager}>👤 {item.manager}</Text>
          <Text style={styles.shopPhone}>📞 {item.phone}</Text>
        </View>
        <View style={styles.shopStatus}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.shopStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.totalStock}</Text>
          <Text style={styles.statLabel}>Total Items</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatCurrency(item.totalValue)}</Text>
          <Text style={styles.statLabel}>Stock Value</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: item.lowStockItems > 0 ? colors.error : colors.success }]}>
            {item.lowStockItems}
          </Text>
          <Text style={styles.statLabel}>Low Stock</Text>
        </View>
      </View>

      <View style={styles.shopActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => generateStockReport(item)}
        >
          <Ionicons name="bar-chart" size={16} color={colors.info} />
          <Text style={styles.actionText}>Stock Report</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setShowTransferModal(true)}
        >
          <Ionicons name="swap-horizontal" size={16} color={colors.warning} />
          <Text style={styles.actionText}>Transfer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="settings" size={16} color={colors.gray[600]} />
          <Text style={styles.actionText}>Manage</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const AddShopModal = () => (
    <Modal
      visible={showAddModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowAddModal(false)}>
            <Ionicons name="close" size={24} color={colors.gray[600]} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Create New Shop</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Shop Name *</Text>
            <TextInput
              style={styles.input}
              value={newShop.name}
              onChangeText={(text) => setNewShop({ ...newShop, name: text })}
              placeholder="Enter shop name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Location *</Text>
            <TextInput
              style={styles.input}
              value={newShop.location}
              onChangeText={(text) => setNewShop({ ...newShop, location: text })}
              placeholder="Enter location"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Manager Name *</Text>
            <TextInput
              style={styles.input}
              value={newShop.manager}
              onChangeText={(text) => setNewShop({ ...newShop, manager: text })}
              placeholder="Enter manager name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={newShop.phone}
              onChangeText={(text) => setNewShop({ ...newShop, phone: text })}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={newShop.email}
              onChangeText={(text) => setNewShop({ ...newShop, email: text })}
              placeholder="Enter email address"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Address</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={newShop.address}
              onChangeText={(text) => setNewShop({ ...newShop, address: text })}
              placeholder="Enter full address"
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity 
            style={styles.createButton}
            onPress={handleAddShop}
          >
            <Text style={styles.createButtonText}>Create Shop</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );

  const TransferModal = () => (
    <Modal
      visible={showTransferModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowTransferModal(false)}>
            <Ionicons name="close" size={24} color={colors.gray[600]} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Stock Transfer</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>From Shop</Text>
            {shops.map((shop) => (
              <TouchableOpacity
                key={shop.id}
                style={[
                  styles.shopSelectCard,
                  transferData.fromShop?.id === shop.id && styles.shopSelectCardSelected
                ]}
                onPress={() => setTransferData({ ...transferData, fromShop: shop })}
              >
                <Text style={styles.shopSelectName}>{shop.name}</Text>
                <Text style={styles.shopSelectLocation}>{shop.location}</Text>
                {transferData.fromShop?.id === shop.id && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>To Shop</Text>
            {shops.map((shop) => (
              <TouchableOpacity
                key={shop.id}
                style={[
                  styles.shopSelectCard,
                  transferData.toShop?.id === shop.id && styles.shopSelectCardSelected
                ]}
                onPress={() => setTransferData({ ...transferData, toShop: shop })}
              >
                <Text style={styles.shopSelectName}>{shop.name}</Text>
                <Text style={styles.shopSelectLocation}>{shop.location}</Text>
                {transferData.toShop?.id === shop.id && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {transferData.fromShop && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Items to Transfer</Text>
              <Text style={styles.sectionSubtitle}>Available items from {transferData.fromShop.name}:</Text>
              
              {transferData.fromShop.inventory?.map((item, index) => {
                const selectedItem = transferData.selectedItems.find(selected => selected.itemId === item.itemId);
                return (
                  <View key={`${transferData.fromShop.id}-${item.itemId}-${index}`} style={styles.itemTransferCard}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemStock}>Available: {item.quantity}</Text>
                    </View>
                    <View style={styles.quantityControls}>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => {
                          const currentQty = selectedItem?.transferQuantity || 0;
                          if (currentQty > 0) {
                            toggleItemSelection(item, currentQty - 1);
                          }
                        }}
                      >
                        <Ionicons name="remove" size={16} color={colors.primary} />
                      </TouchableOpacity>
                      
                      <TextInput
                        style={styles.quantityInput}
                        value={(selectedItem?.transferQuantity || 0).toString()}
                        onChangeText={(text) => {
                          const qty = parseInt(text) || 0;
                          if (qty <= item.quantity) {
                            toggleItemSelection(item, qty);
                          }
                        }}
                        keyboardType="numeric"
                        maxLength={3}
                      />
                      
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => {
                          const currentQty = selectedItem?.transferQuantity || 0;
                          if (currentQty < item.quantity) {
                            toggleItemSelection(item, currentQty + 1);
                          }
                        }}
                      >
                        <Ionicons name="add" size={16} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
              
              {transferData.selectedItems.length > 0 && (
                <View style={styles.transferSummary}>
                  <Text style={styles.transferSummaryTitle}>Transfer Summary:</Text>
                  {transferData.selectedItems.map((item, index) => (
                    <Text key={`transfer-${item.itemId}-${index}`} style={styles.transferSummaryItem}>
                      • {item.name}: {item.transferQuantity} units
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}

          <TouchableOpacity 
            style={styles.transferButton}
            onPress={handleTransfer}
          >
            <Text style={styles.transferButtonText}>Initiate Transfer</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );

  const StockReportModal = () => (
    <Modal
      visible={showStockReportModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowStockReportModal(false)}>
            <Ionicons name="close" size={24} color={colors.gray[600]} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Stock Report - {selectedShop?.name}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.reportHeader}>
            <Text style={styles.reportTitle}>{selectedShop?.name}</Text>
            <Text style={styles.reportSubtitle}>{selectedShop?.location}</Text>
            <Text style={styles.reportDate}>Report Date: {new Date().toLocaleDateString()}</Text>
          </View>

          <View style={styles.reportStats}>
            <View style={styles.reportStatItem}>
              <Text style={styles.reportStatValue}>{selectedShop?.totalStock}</Text>
              <Text style={styles.reportStatLabel}>Total Items</Text>
            </View>
            <View style={styles.reportStatItem}>
              <Text style={styles.reportStatValue}>{formatCurrency(selectedShop?.totalValue)}</Text>
              <Text style={styles.reportStatLabel}>Total Value</Text>
            </View>
            <View style={styles.reportStatItem}>
              <Text style={[styles.reportStatValue, { color: colors.error }]}>
                {selectedShop?.lowStockItems}
              </Text>
              <Text style={styles.reportStatLabel}>Low Stock</Text>
            </View>
          </View>

          <View style={styles.inventorySection}>
            <Text style={styles.sectionTitle}>Inventory Details</Text>
            {selectedShop?.inventory?.map((item, index) => (
              <View key={`${selectedShop.id}-${item.itemId}-${index}`} style={styles.inventoryItem}>
                <View style={styles.inventoryItemInfo}>
                  <Text style={styles.inventoryItemName}>{item.name}</Text>
                  <Text style={styles.inventoryItemQuantity}>Qty: {item.quantity}</Text>
                </View>
                <Text style={styles.inventoryItemValue}>{formatCurrency(item.value)}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.exportButton}>
            <Ionicons name="download" size={16} color={colors.white} />
            <Text style={styles.exportButtonText}>Export Report</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <View style={globalStyles.container}>
      {/* Header */}
      <LinearGradient
        colors={[colors.purple[600], colors.purple[700]]}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shop Management</Text>
        
        {/* Integrated Stats in Header */}
        <View style={styles.headerStats}>
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatValue}>{shops.length}</Text>
            <Text style={styles.headerStatLabel}>Total Shops</Text>
          </View>
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatValue}>{shops.filter(shop => shop.status === "active").length}</Text>
            <Text style={styles.headerStatLabel}>Active</Text>
          </View>
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatValue}>{formatCurrency(shops.reduce((sum, shop) => sum + shop.totalValue, 0))}</Text>
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
          onPress={() => setShowTransferModal(true)}
        >
          <Ionicons name="swap-horizontal" size={20} color={colors.warning} />
          <Text style={styles.filterButtonText}>Transfer</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, styles.primaryAction]}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={20} color={colors.white} />
          <Text style={[styles.filterButtonText, { color: colors.white }]}>
            New Shop
          </Text>
        </TouchableOpacity>
      </View>

      {/* Shops List */}
      <FlatList
        data={shops}
        renderItem={renderShopItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshing={loading}
        onRefresh={loadShops}
        showsVerticalScrollIndicator={false}
      />

      <AddShopModal />
      <TransferModal />
      <StockReportModal />
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
  shopCard: {
    marginBottom: spacing.md,
  },
  shopHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.gray[800],
    marginBottom: spacing.xs,
  },
  shopLocation: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  shopManager: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  shopPhone: {
    fontSize: 14,
    color: colors.gray[600],
  },
  shopStatus: {
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
  shopStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.gray[200],
    marginBottom: spacing.md,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray[600],
  },
  shopActions: {
    flexDirection: "row",
    justifyContent: "space-around",
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
  inputGroup: {
    marginVertical: spacing.md,
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
  section: {
    marginVertical: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.gray[800],
    marginBottom: spacing.md,
  },
  shopSelectCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
    marginBottom: spacing.sm,
  },
  shopSelectCardSelected: {
    backgroundColor: colors.primary + "20",
    borderColor: colors.primary,
  },
  shopSelectName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.gray[800],
  },
  shopSelectLocation: {
    fontSize: 14,
    color: colors.gray[600],
  },
  transferButton: {
    backgroundColor: colors.warning,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
    marginVertical: spacing.lg,
  },
  transferButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  reportHeader: {
    alignItems: "center",
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    marginBottom: spacing.md,
  },
  reportTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.gray[800],
    marginBottom: spacing.xs,
  },
  reportSubtitle: {
    fontSize: 16,
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  reportDate: {
    fontSize: 14,
    color: colors.gray[500],
  },
  reportStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    marginBottom: spacing.md,
  },
  reportStatItem: {
    alignItems: "center",
    flex: 1,
  },
  reportStatValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  reportStatLabel: {
    fontSize: 12,
    color: colors.gray[600],
  },
  inventorySection: {
    marginBottom: spacing.lg,
  },
  inventoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  inventoryItemInfo: {
    flex: 1,
  },
  inventoryItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.gray[800],
    marginBottom: spacing.xs,
  },
  inventoryItemQuantity: {
    fontSize: 14,
    color: colors.gray[600],
  },
  inventoryItemValue: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
  },
  exportButton: {
    flexDirection: "row",
    backgroundColor: colors.info,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  exportButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: spacing.md,
    fontStyle: "italic",
  },
  itemTransferCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
    marginBottom: spacing.sm,
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
  itemStock: {
    fontSize: 14,
    color: colors.gray[600],
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.gray[100],
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  quantityInput: {
    width: 50,
    height: 32,
    textAlign: "center",
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.sm,
    marginHorizontal: spacing.sm,
    fontSize: 16,
    backgroundColor: colors.white,
  },
  transferSummary: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.primary + "10",
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary + "30",
  },
  transferSummaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  transferSummaryItem: {
    fontSize: 14,
    color: colors.gray[700],
    marginBottom: spacing.xs,
  },
});

export default ShopScreen; 