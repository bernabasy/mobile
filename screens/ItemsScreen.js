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
import Button from "../components/Button";
import Card from "../components/Card";
import { itemsAPI } from "../services/api";
import {
    borderRadius,
    colors,
    formatCurrency,
    globalStyles,
    spacing
} from "../styles/theme";

const ItemsScreen = ({ navigation }) => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  
  const [newItem, setNewItem] = useState({
    name: "",
    category: "",
    description: "",
    sku: "",
    unit: "",
    costPrice: "",
    salesPrice: "",
    currentStock: "",
    minStock: "",
    reorderLevel: "",
  });

  useEffect(() => {
    loadItems();
    loadCategories();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const response = await itemsAPI.getAll({
        search: searchQuery,
        category: selectedCategory,
      });
      if (response.data.success) {
        setItems(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to load items');
      }
    } catch (error) {
      console.error("Error loading items:", error);
      Alert.alert("Error", "Failed to load items");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await itemsAPI.getCategories();
      if (response.data.success) {
        setCategories(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to load categories');
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      setCategories(["Grains", "Oils", "Sweeteners", "Spices", "Beverages"]); // Fallback
    }
  };

  const handleAddItem = async () => {
    try {
      const itemData = {
        ...newItem,
        costPrice: parseFloat(newItem.costPrice) || 0,
        salesPrice: parseFloat(newItem.salesPrice) || 0,
        currentStock: parseInt(newItem.currentStock) || 0,
        minStock: parseInt(newItem.minStock) || 0,
        reorderLevel: parseInt(newItem.reorderLevel) || 0,
      };

      const response = await itemsAPI.create(itemData);
      if (response.data.success) {
        await loadItems(); // Reload the list
        Alert.alert("Success", "Item added successfully");
        closeAddModal();
      } else {
        throw new Error(response.data.message || 'Failed to add item');
      }
    } catch (error) {
      console.error("Error adding item:", error);
      Alert.alert("Error", "Failed to add item");
    }
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setNewItem({
      name: "",
      category: "",
      description: "",
      sku: "",
      unit: "",
      costPrice: "",
      salesPrice: "",
      currentStock: "",
      minStock: "",
      reorderLevel: "",
    });
  };

  const openItemDetail = (item) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedItem(null);
  };

  const getStockStatus = (item) => {
    if (item.currentStock === 0) return "Out of Stock";
    if (item.currentStock <= item.reorderLevel) return "Low Stock";
    if (item.currentStock <= item.minStock) return "Minimum";
    return "In Stock";
  };

  const getStockStatusColor = (item) => {
    if (item.currentStock === 0) return colors.error;
    if (item.currentStock <= item.reorderLevel) return colors.warning;
    if (item.currentStock <= item.minStock) return colors.orange[500];
    return colors.success;
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(page);
  };

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

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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
          {filteredItems.length} total items
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

  const renderItem = ({ item }) => (
    <Card style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemSku}>SKU: {item.sku}</Text>
          <Text style={styles.itemCategory}>{item.category}</Text>
        </View>
        <View style={styles.itemActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="pencil" size={18} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => openItemDetail(item)}
          >
            <Ionicons name="eye" size={18} color={colors.info} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.itemDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Stock:</Text>
          <Text style={styles.detailValue}>
            {item.currentStock} {item.unit}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Price:</Text>
          <Text style={styles.detailValue}>
            {formatCurrency(item.salesPrice)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Status:</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStockStatusColor(item) },
            ]}
          >
            <Text style={styles.statusText}>{getStockStatus(item)}</Text>
          </View>
        </View>
      </View>
    </Card>
  );

  const ItemDetailModal = () => (
    <Modal
      visible={showDetailModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={closeDetailModal}>
            <Ionicons name="close" size={24} color={colors.gray[600]} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Item Details</Text>
          <TouchableOpacity>
            <Ionicons name="pencil" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {selectedItem && (
          <ScrollView style={styles.modalContent}>
            <Card style={styles.detailCard}>
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Basic Information</Text>
                <View style={styles.detailGrid}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailItemLabel}>Name</Text>
                    <Text style={styles.detailItemValue}>{selectedItem.name}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailItemLabel}>SKU</Text>
                    <Text style={styles.detailItemValue}>{selectedItem.sku}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailItemLabel}>Category</Text>
                    <Text style={styles.detailItemValue}>{selectedItem.category}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailItemLabel}>Unit</Text>
                    <Text style={styles.detailItemValue}>{selectedItem.unit}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Stock Information</Text>
                <View style={styles.detailGrid}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailItemLabel}>Current Stock</Text>
                    <Text style={[styles.detailItemValue, { color: getStockStatusColor(selectedItem) }]}>
                      {selectedItem.currentStock} {selectedItem.unit}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailItemLabel}>Min Stock</Text>
                    <Text style={styles.detailItemValue}>{selectedItem.minStock} {selectedItem.unit}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailItemLabel}>Reorder Level</Text>
                    <Text style={styles.detailItemValue}>{selectedItem.reorderLevel} {selectedItem.unit}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailItemLabel}>Status</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStockStatusColor(selectedItem) },
                      ]}
                    >
                      <Text style={styles.statusText}>{getStockStatus(selectedItem)}</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Pricing</Text>
                <View style={styles.detailGrid}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailItemLabel}>Cost Price</Text>
                    <Text style={styles.detailItemValue}>{formatCurrency(selectedItem.costPrice)}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailItemLabel}>Sales Price</Text>
                    <Text style={styles.detailItemValue}>{formatCurrency(selectedItem.salesPrice)}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailItemLabel}>Profit Margin</Text>
                    <Text style={[styles.detailItemValue, { color: colors.success }]}>
                      {formatCurrency(selectedItem.salesPrice - selectedItem.costPrice)}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailItemLabel}>Stock Value</Text>
                    <Text style={styles.detailItemValue}>
                      {formatCurrency(selectedItem.currentStock * selectedItem.costPrice)}
                    </Text>
                  </View>
                </View>
              </View>

              {selectedItem.description && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Description</Text>
                  <Text style={styles.descriptionText}>{selectedItem.description}</Text>
                </View>
              )}
            </Card>
          </ScrollView>
        )}
      </View>
    </Modal>
  );

  const AddItemModal = () => (
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
              onChangeText={(text) =>
                setNewItem({ ...newItem, category: text })
              }
              placeholder="Enter category"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>SKU *</Text>
            <TextInput
              style={styles.input}
              value={newItem.sku}
              onChangeText={(text) => setNewItem({ ...newItem, sku: text })}
              placeholder="Enter SKU"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Unit *</Text>
            <TextInput
              style={styles.input}
              value={newItem.unit}
              onChangeText={(text) => setNewItem({ ...newItem, unit: text })}
              placeholder="e.g., kg, pcs, bottle"
            />
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Cost Price (Birr) *</Text>
              <TextInput
                style={styles.input}
                value={newItem.costPrice}
                onChangeText={(text) =>
                  setNewItem({ ...newItem, costPrice: text })
                }
                placeholder="0.00"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Sales Price (Birr) *</Text>
              <TextInput
                style={styles.input}
                value={newItem.salesPrice}
                onChangeText={(text) =>
                  setNewItem({ ...newItem, salesPrice: text })
                }
                placeholder="0.00"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Current Stock *</Text>
              <TextInput
                style={styles.input}
                value={newItem.currentStock}
                onChangeText={(text) =>
                  setNewItem({ ...newItem, currentStock: text })
                }
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputHalf}>
              <Text style={styles.inputLabel}>Min Stock *</Text>
              <TextInput
                style={styles.input}
                value={newItem.minStock}
                onChangeText={(text) =>
                  setNewItem({ ...newItem, minStock: text })
                }
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Reorder Level *</Text>
            <TextInput
              style={styles.input}
              value={newItem.reorderLevel}
              onChangeText={(text) =>
                setNewItem({ ...newItem, reorderLevel: text })
              }
              placeholder="0"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={newItem.description}
              onChangeText={(text) =>
                setNewItem({ ...newItem, description: text })
              }
              placeholder="Enter description (optional)"
              multiline
              numberOfLines={3}
            />
          </View>

          <Button
            title="Add Item"
            onPress={handleAddItem}
            style={styles.addButtonModal}
          />
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
        <Text style={styles.headerTitle}>Items Management</Text>
        
        {/* Integrated Stats in Header */}
        <View style={styles.headerStats}>
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatValue}>{items.length}</Text>
            <Text style={styles.headerStatLabel}>Total Items</Text>
          </View>
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatValue}>{items.filter(item => item.currentStock === 0).length}</Text>
            <Text style={styles.headerStatLabel}>Out of Stock</Text>
          </View>
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatValue}>{items.filter(item => item.currentStock <= item.reorderLevel && item.currentStock > 0).length}</Text>
            <Text style={styles.headerStatLabel}>Low Stock</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Search and Filter */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color={colors.gray[400]}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Items List */}
      <FlatList
        data={paginatedItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshing={loading}
        onRefresh={loadItems}
        showsVerticalScrollIndicator={false}
      />

      {/* Pagination Controls */}
      {totalPages > 1 && renderPaginationControls()}

      <AddItemModal />
      <ItemDetailModal />
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
  searchSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.sm,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: spacing.md,
  },
  listContainer: {
    paddingBottom: spacing.xl,
  },
  itemCard: {
    marginBottom: spacing.sm,
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
  itemSku: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  itemCategory: {
    fontSize: 12,
    color: colors.gray[500],
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: "flex-start",
  },
  itemActions: {
    flexDirection: "row",
  },
  actionButton: {
    padding: spacing.sm,
    marginLeft: spacing.xs,
  },
  itemDetails: {
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    paddingTop: spacing.md,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.gray[600],
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.gray[800],
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.white,
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
    paddingVertical: spacing.md,
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
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  inputHalf: {
    flex: 1,
    marginRight: spacing.sm,
  },
  addButtonModal: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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
  // Detail modal styles
  detailCard: {
    marginBottom: spacing.lg,
  },
  detailSection: {
    marginBottom: spacing.lg,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.gray[800],
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    paddingBottom: spacing.sm,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailItem: {
    width: '48%',
    marginBottom: spacing.md,
  },
  detailItemLabel: {
    fontSize: 12,
    color: colors.gray[600],
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  detailItemValue: {
    fontSize: 14,
    color: colors.gray[800],
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 14,
    color: colors.gray[700],
    lineHeight: 20,
  },
});

export default ItemsScreen;