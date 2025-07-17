import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
    View,
} from "react-native";
import Button from "../components/Button";
import Card from "../components/Card";
import { suppliersAPI } from "../services/api";
import {
    borderRadius,
    colors,
    formatCurrency,
    globalStyles,
    spacing,
} from "../styles/theme";

const SuppliersScreen = ({ navigation }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [newSupplier, setNewSupplier] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    creditLimit: "",
    paymentTerms: "Net 30",
    taxId: "",
    notes: "",
  });

  const [paymentData, setPaymentData] = useState({
    amount: "",
    paymentMethod: "cash",
    reference: "",
    notes: "",
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await suppliersAPI.getAll();
      if (response.data.success) {
        setSuppliers(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to load suppliers');
      }
    } catch (error) {
      console.error("Error loading suppliers:", error);
      Alert.alert("Error", "Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSuppliers();
    setRefreshing(false);
  }, [loadSuppliers]);

  const handleAddSupplier = useCallback(async () => {
    try {
      if (!newSupplier.name.trim()) {
        Alert.alert("Error", "Supplier name is required");
        return;
      }

      const supplierData = {
        ...newSupplier,
        creditLimit: parseFloat(newSupplier.creditLimit) || 0,
      };

      const response = await suppliersAPI.create(supplierData);
      if (response.data.success) {
        await loadSuppliers(); // Reload the list
        setShowAddModal(false);
        resetNewSupplier();
        Alert.alert("Success", "Supplier added successfully");
      } else {
        throw new Error(response.data.message || 'Failed to add supplier');
      }
    } catch (error) {
      console.error("Error adding supplier:", error);
      Alert.alert("Error", "Failed to add supplier");
    }
  }, [newSupplier, loadSuppliers]);

  const handleRecordPayment = useCallback(async () => {
    try {
      if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
        Alert.alert("Error", "Please enter a valid payment amount");
        return;
      }

      const amount = parseFloat(paymentData.amount);
      if (amount > selectedSupplier.currentBalance) {
        Alert.alert("Error", "Payment amount cannot exceed outstanding balance");
        return;
      }

      // Update supplier balance
      setSuppliers(prev => prev.map(supplier => 
        supplier.id === selectedSupplier.id 
          ? { ...supplier, currentBalance: supplier.currentBalance - amount }
          : supplier
      ));

      setSelectedSupplier(prev => ({
        ...prev,
        currentBalance: prev.currentBalance - amount
      }));

      setShowPaymentModal(false);
      setPaymentData({ amount: "", paymentMethod: "cash", reference: "", notes: "" });
      Alert.alert("Success", "Payment recorded successfully");
    } catch (error) {
      console.error("Error recording payment:", error);
      Alert.alert("Error", "Failed to record payment");
    }
  }, [paymentData, selectedSupplier]);

  const resetNewSupplier = useCallback(() => {
    setNewSupplier({
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      country: "",
      creditLimit: "",
      paymentTerms: "Net 30",
      taxId: "",
      notes: "",
    });
  }, []);

  const filteredSuppliers = useMemo(() => {
    if (!searchQuery.trim()) return suppliers;
    return suppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.phone.includes(searchQuery)
    );
  }, [suppliers, searchQuery]);

  const SupplierCard = useCallback(({ supplier }) => (
    <Card style={styles.supplierCard}>
      <TouchableOpacity 
        onPress={() => {
          setSelectedSupplier(supplier);
          setShowDetailsModal(true);
        }}
      >
        <View style={styles.supplierHeader}>
          <View style={styles.supplierInfo}>
            <Text style={styles.supplierName}>{supplier.name}</Text>
            <Text style={styles.supplierContact}>{supplier.phone}</Text>
            <Text style={styles.supplierEmail}>{supplier.email}</Text>
          </View>
          <View style={styles.supplierStats}>
            <Text style={[
              styles.balanceAmount,
              { color: supplier.currentBalance > 0 ? colors.warning : colors.success }
            ]}>
              {formatCurrency(supplier.currentBalance || 0)}
            </Text>
            <Text style={styles.balanceLabel}>Payable</Text>
          </View>
        </View>

        <View style={styles.supplierDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Credit Limit:</Text>
            <Text style={styles.detailValue}>{formatCurrency(supplier.creditLimit || 0)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Purchases:</Text>
            <Text style={styles.detailValue}>{formatCurrency(supplier.totalPurchases || 0)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Terms:</Text>
            <Text style={styles.detailValue}>{supplier.paymentTerms}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Card>
  ), []);

  const renderSupplier = useCallback(({ item }) => (
    <SupplierCard supplier={item} />
  ), [SupplierCard]);

  const keyExtractor = useCallback((item) => item.id.toString(), []);

  return (
    <View style={globalStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={globalStyles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.gray[800]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Suppliers</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)}>
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.gray[400]} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search suppliers..."
          placeholderTextColor={colors.gray[400]}
        />
      </View>

      {/* Supplier List */}
      <FlatList
        data={filteredSuppliers}
        renderItem={renderSupplier}
        keyExtractor={keyExtractor}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
      />

      {/* Add Supplier Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Supplier</Text>
            <TouchableOpacity onPress={handleAddSupplier}>
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Supplier Name *</Text>
              <TextInput
                style={styles.input}
                value={newSupplier.name}
                onChangeText={(text) => setNewSupplier({...newSupplier, name: text})}
                placeholder="Enter supplier name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={newSupplier.email}
                onChangeText={(text) => setNewSupplier({...newSupplier, email: text})}
                placeholder="Enter email address"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput
                style={styles.input}
                value={newSupplier.phone}
                onChangeText={(text) => setNewSupplier({...newSupplier, phone: text})}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Credit Limit</Text>
              <TextInput
                style={styles.input}
                value={newSupplier.creditLimit}
                onChangeText={(text) => setNewSupplier({...newSupplier, creditLimit: text})}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Payment Terms</Text>
              <TextInput
                style={styles.input}
                value={newSupplier.paymentTerms}
                onChangeText={(text) => setNewSupplier({...newSupplier, paymentTerms: text})}
                placeholder="Net 30"
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Supplier Details Modal */}
      <Modal visible={showDetailsModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
              <Text style={styles.modalCancelText}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Supplier Details</Text>
            <TouchableOpacity>
              <Text style={styles.modalSaveText}>Edit</Text>
            </TouchableOpacity>
          </View>

          {selectedSupplier && (
            <ScrollView style={styles.modalContent}>
              <Card style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Contact Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name:</Text>
                  <Text style={styles.detailValue}>{selectedSupplier.name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailValue}>{selectedSupplier.email}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone:</Text>
                  <Text style={styles.detailValue}>{selectedSupplier.phone}</Text>
                </View>
              </Card>

              <Card style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Financial Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Credit Limit:</Text>
                  <Text style={styles.detailValue}>{formatCurrency(selectedSupplier.creditLimit || 0)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Outstanding Payable:</Text>
                  <Text style={[
                    styles.detailValue,
                    { color: selectedSupplier.currentBalance > 0 ? colors.warning : colors.success }
                  ]}>
                    {formatCurrency(selectedSupplier.currentBalance || 0)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Purchases:</Text>
                  <Text style={styles.detailValue}>{formatCurrency(selectedSupplier.totalPurchases || 0)}</Text>
                </View>
              </Card>

              {selectedSupplier.currentBalance > 0 && (
                <View style={styles.actionButtons}>
                  <Button
                    title="Record Payment"
                    onPress={() => setShowPaymentModal(true)}
                    style={styles.actionButton}
                  />
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Payment Modal */}
      <Modal visible={showPaymentModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Record Payment</Text>
            <TouchableOpacity onPress={handleRecordPayment}>
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedSupplier && (
              <Card style={styles.paymentCard}>
                <Text style={styles.paymentSupplier}>{selectedSupplier.name}</Text>
                <Text style={styles.paymentBalance}>
                  Outstanding Payable: {formatCurrency(selectedSupplier.currentBalance || 0)}
                </Text>
              </Card>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Payment Amount *</Text>
              <TextInput
                style={styles.input}
                value={paymentData.amount}
                onChangeText={(text) => setPaymentData({...paymentData, amount: text})}
                placeholder="Enter payment amount"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Payment Method</Text>
              <View style={styles.paymentMethods}>
                {["cash", "bank", "check"].map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={[
                      styles.paymentMethodButton,
                      paymentData.paymentMethod === method && styles.paymentMethodSelected
                    ]}
                    onPress={() => setPaymentData({...paymentData, paymentMethod: method})}
                  >
                    <Text style={[
                      styles.paymentMethodText,
                      paymentData.paymentMethod === method && styles.paymentMethodTextSelected
                    ]}>
                      {method.charAt(0).toUpperCase() + method.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.gray[800],
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.gray[800],
  },
  supplierCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  supplierHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  supplierInfo: {
    flex: 1,
  },
  supplierName: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.gray[800],
    marginBottom: spacing.xs,
  },
  supplierContact: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  supplierEmail: {
    fontSize: 14,
    color: colors.gray[500],
  },
  supplierStats: {
    alignItems: "flex-end",
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: spacing.xs,
  },
  balanceLabel: {
    fontSize: 12,
    color: colors.gray[500],
  },
  supplierDetails: {
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
    fontWeight: "500",
    color: colors.gray[800],
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.light,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.gray[800],
  },
  modalCancelText: {
    fontSize: 16,
    color: colors.gray[600],
  },
  modalSaveText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "600",
  },
  modalContent: {
    flex: 1,
    padding: spacing.md,
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
    color: colors.gray[800],
  },
  detailCard: {
    marginBottom: spacing.md,
  },
  detailCardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.gray[800],
    marginBottom: spacing.md,
  },
  actionButtons: {
    marginVertical: spacing.sm,
  },
  actionButton: {
    marginBottom: spacing.sm,
  },
  paymentCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.warning,
  },
  paymentSupplier: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: spacing.xs,
  },
  paymentBalance: {
    fontSize: 16,
    color: colors.white,
  },
  paymentMethods: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  paymentMethodButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray[300],
    backgroundColor: colors.white,
    marginHorizontal: spacing.xs,
    alignItems: "center",
  },
  paymentMethodSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  paymentMethodText: {
    fontSize: 14,
    color: colors.gray[700],
    fontWeight: "500",
  },
  paymentMethodTextSelected: {
    color: colors.white,
  },
});

export default SuppliersScreen; 