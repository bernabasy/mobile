import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import Button from '../components/Button';
import Card from '../components/Card';
import { salesAPI } from '../services/api';
import {
    borderRadius,
    colors,
    formatCurrency,
    formatDate,
    globalStyles,
    spacing,
} from '../styles/theme';

const SalesScreen = ({ navigation }) => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  
  const [newSale, setNewSale] = useState({
    customer: '',
    items: [],
    notes: '',
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      setLoading(true);
      const response = await salesAPI.getAll();
      if (response.data.success) {
        setSales(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to load sales');
      }
    } catch (error) {
      console.error("Error loading sales:", error);
      Alert.alert("Error", "Failed to load sales data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'cancelled':
        return colors.error;
      default:
        return colors.gray[500];
    }
  };

  const handleCreateSale = () => {
    if (!newSale.customer) {
      Alert.alert('Error', 'Please enter customer name');
      return;
    }

    const saleData = {
      id: Date.now(),
      customer: newSale.customer,
      amount: 0, // Calculate based on items
      date: new Date(),
      status: 'pending',
      items: [],
    };

    setSales([saleData, ...sales]);
    Alert.alert('Success', 'Sale created successfully');
    closeAddModal();
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setNewSale({ customer: '', items: [], notes: '' });
  };

  const openSaleDetail = (sale) => {
    setSelectedSale(sale);
    setShowDetailModal(true);
  };

  const closeSaleDetailModal = () => {
    setShowDetailModal(false);
    setSelectedSale(null);
  };

  const filteredSales = sales.filter(sale =>
    sale.customer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSales = filteredSales.slice(startIndex, endIndex);

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
          {filteredSales.length} total sales
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

  const renderSaleItem = ({ item }) => (
    <Card style={styles.saleCard}>
      <View style={styles.saleHeader}>
        <View style={styles.saleInfo}>
          <Text style={styles.customerName}>{item.customer}</Text>
          <Text style={styles.saleDate}>{formatDate(item.date)}</Text>
        </View>
        <View style={styles.saleAmount}>
          <Text style={styles.amountText}>{formatCurrency(item.amount)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.itemsList}>
        <Text style={styles.itemsTitle}>Items:</Text>
        {item.items.map((saleItem, index) => (
          <Text key={index} style={styles.itemText}>
            {saleItem.quantity}x {saleItem.name} - {formatCurrency(saleItem.price * saleItem.quantity)}
          </Text>
        ))}
      </View>
      
      <View style={styles.saleActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => openSaleDetail(item)}
        >
          <Ionicons name="eye" size={18} color={colors.info} />
          <Text style={styles.actionText}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="pencil" size={18} color={colors.primary} />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="receipt" size={18} color={colors.success} />
          <Text style={styles.actionText}>Receipt</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const SaleDetailModal = () => (
    <Modal
      visible={showDetailModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={closeSaleDetailModal}>
            <Ionicons name="close" size={24} color={colors.gray[600]} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Sale Details</Text>
          <TouchableOpacity>
            <Ionicons name="pencil" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {selectedSale && (
          <ScrollView style={styles.modalContent}>
            <Card style={styles.detailCard}>
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Sale Information</Text>
                <View style={styles.detailGrid}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailItemLabel}>Customer</Text>
                    <Text style={styles.detailItemValue}>{selectedSale.customer}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailItemLabel}>Date</Text>
                    <Text style={styles.detailItemValue}>{formatDate(selectedSale.date)}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailItemLabel}>Amount</Text>
                    <Text style={styles.detailItemValue}>{formatCurrency(selectedSale.amount)}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailItemLabel}>Status</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedSale.status) }]}>
                      <Text style={styles.statusText}>{selectedSale.status.toUpperCase()}</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Items Sold</Text>
                {selectedSale.items.map((item, index) => (
                  <View key={index} style={styles.itemDetailRow}>
                    <Text style={styles.itemDetailName}>{item.name}</Text>
                    <Text style={styles.itemDetailQuantity}>Qty: {item.quantity}</Text>
                    <Text style={styles.itemDetailPrice}>{formatCurrency(item.price * item.quantity)}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </ScrollView>
        )}
      </View>
    </Modal>
  );

  const AddSaleModal = () => (
    <Modal
      visible={showAddModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={closeAddModal}>
            <Ionicons name="close" size={24} color={colors.gray[600]} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>New Sale</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Customer Name *</Text>
            <TextInput
              style={styles.input}
              value={newSale.customer}
              onChangeText={(text) => setNewSale({ ...newSale, customer: text })}
              placeholder="Enter customer name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={newSale.notes}
              onChangeText={(text) => setNewSale({ ...newSale, notes: text })}
              placeholder="Add notes (optional)"
              multiline
              numberOfLines={3}
            />
          </View>

          <Button
            title="Create Sale"
            onPress={handleCreateSale}
            style={styles.createButton}
          />
        </ScrollView>
      </View>
    </Modal>
  );

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
        <Text style={styles.headerTitle}>Sales Management</Text>
        
        {/* Integrated Stats in Header */}
        <View style={styles.headerStats}>
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatValue}>{formatCurrency(sales.reduce((sum, sale) => sum + sale.amount, 0))}</Text>
            <Text style={styles.headerStatLabel}>Total Sales</Text>
          </View>
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatValue}>{sales.length}</Text>
            <Text style={styles.headerStatLabel}>Transactions</Text>
          </View>
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatValue}>{sales.filter(sale => sale.status === 'pending').length}</Text>
            <Text style={styles.headerStatLabel}>Pending</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Search and Add Section */}
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
            placeholder="Search sales..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("SalesOrder", { createMode: true })}
        >
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Sales List */}
      <FlatList
        data={paginatedSales}
        renderItem={renderSaleItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshing={loading}
        onRefresh={() => {}}
        showsVerticalScrollIndicator={false}
      />

      {/* Pagination Controls */}
      {totalPages > 1 && renderPaginationControls()}

      <AddSaleModal />
      <SaleDetailModal />
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
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
    backgroundColor: colors.orange[500],
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.md,
  },
  listContainer: {
    paddingBottom: spacing.xl,
  },
  saleCard: {
    marginBottom: spacing.sm,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  saleInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray[800],
    marginBottom: spacing.xs,
  },
  saleDate: {
    fontSize: 14,
    color: colors.gray[600],
  },
  saleAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.orange[500],
    marginBottom: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  itemsList: {
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    paddingTop: spacing.md,
    marginBottom: spacing.md,
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  itemText: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  saleActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    paddingTop: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
    fontWeight: '600',
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
    textAlignVertical: 'top',
  },
  createButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
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
  itemDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  itemDetailName: {
    flex: 1,
    fontSize: 14,
    color: colors.gray[800],
    fontWeight: '600',
  },
  itemDetailQuantity: {
    fontSize: 14,
    color: colors.gray[600],
    marginHorizontal: spacing.sm,
  },
  itemDetailPrice: {
    fontSize: 14,
    color: colors.orange[500],
    fontWeight: '600',
  },
});

export default SalesScreen; 