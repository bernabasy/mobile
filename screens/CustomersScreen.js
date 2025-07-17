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
import { customersAPI } from "../services/api";
import {
    borderRadius,
    colors,
    formatCurrency,
    globalStyles,
    spacing,
} from "../styles/theme";

const CustomersScreen = ({ navigation }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [newCustomer, setNewCustomer] = useState({
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
    loadCustomers();
  }, []);

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await customersAPI.getAll();
      if (response.data.success) {
        setCustomers(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to load customers');
      }
    } catch (error) {
      console.error("Error loading customers:", error);
      Alert.alert("Error", "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCustomers();
    setRefreshing(false);
  }, [loadCustomers]);

  const handleAddCustomer = useCallback(async () => {
    try {
      if (!newCustomer.name.trim()) {
        Alert.alert("Error", "Customer name is required");
        return;
      }

      const customerData = {
        ...newCustomer,
        creditLimit: parseFloat(newCustomer.creditLimit) || 0,
      };

      const response = await customersAPI.create(customerData);
      if (response.data.success) {
        await loadCustomers(); // Reload the list
        setShowAddModal(false);
        resetNewCustomer();
        Alert.alert("Success", "Customer added successfully");
      } else {
        throw new Error(response.data.message || 'Failed to add customer');
      }
    } catch (error) {
      console.error("Error adding customer:", error);
      Alert.alert("Error", "Failed to add customer");
    }
  }, [newCustomer, loadCustomers]);

  const handleRecordPayment = useCallback(async () => {
    try {
      if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
        Alert.alert("Error", "Please enter a valid payment amount");
        return;
      }

      const amount = parseFloat(paymentData.amount);
      if (amount > selectedCustomer.currentBalance) {
        Alert.alert("Error", "Payment amount cannot exceed outstanding balance");
        return;
      }

      // Update customer balance
      setCustomers(prev => prev.map(customer => 
        customer.id === selectedCustomer.id 
          ? { ...customer, currentBalance: customer.currentBalance - amount }
          : customer
      ));

      setSelectedCustomer(prev => ({
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
  }, [paymentData, selectedCustomer]);

  const resetNewCustomer = useCallback(() => {
    setNewCustomer({
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

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery)
    );
  }, [customers, searchQuery]);

  const CustomerCard = useCallback(({ customer }) => (
    <Card style={styles.customerCard}>
      <TouchableOpacity 
        onPress={() => {
          setSelectedCustomer(customer);
          setShowDetailsModal(true);
        }}
      >
        <View style={styles.customerHeader}>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{customer.name}</Text>
            <Text style={styles.customerContact}>{customer.phone}</Text>
            <Text style={styles.customerEmail}>{customer.email}</Text>
          </View>
          <View style={styles.customerStats}>
            <Text style={[
              styles.balanceAmount,
              { color: customer.currentBalance > 0 ? colors.error : colors.success }
            ]}>
              {formatCurrency(customer.currentBalance || 0)}
            </Text>
            <Text style={styles.balanceLabel}>Outstanding</Text>
          </View>
        </View>

        <View style={styles.customerDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Credit Limit:</Text>
            <Text style={styles.detailValue}>{formatCurrency(customer.creditLimit || 0)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Sales:</Text>
            <Text style={styles.detailValue}>{formatCurrency(customer.totalSales || 0)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Terms:</Text>
            <Text style={styles.detailValue}>{customer.paymentTerms}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Card>
  ), []);

  const renderCustomer = useCallback(({ item }) => (
    <CustomerCard customer={item} />
  ), [CustomerCard]);

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
        <Text style={styles.headerTitle}>Customers</Text>
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
          placeholder="Search customers..."
          placeholderTextColor={colors.gray[400]}
        />
      </View>

      {/* Customer List */}
      <FlatList
        data={filteredCustomers}
        renderItem={renderCustomer}
        keyExtractor={keyExtractor}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
      />

      {/* Add Customer Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Customer</Text>
            <TouchableOpacity onPress={handleAddCustomer}>
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Customer Name *</Text>
              <TextInput
                style={styles.input}
                value={newCustomer.name}
                onChangeText={(text) => setNewCustomer({...newCustomer, name: text})}
                placeholder="Enter customer name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={newCustomer.email}
                onChangeText={(text) => setNewCustomer({...newCustomer, email: text})}
                placeholder="Enter email address"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput
                style={styles.input}
                value={newCustomer.phone}
                onChangeText={(text) => setNewCustomer({...newCustomer, phone: text})}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Credit Limit</Text>
              <TextInput
                style={styles.input}
                value={newCustomer.creditLimit}
                onChangeText={(text) => setNewCustomer({...newCustomer, creditLimit: text})}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Payment Terms</Text>
              <TextInput
                style={styles.input}
                value={newCustomer.paymentTerms}
                onChangeText={(text) => setNewCustomer({...newCustomer, paymentTerms: text})}
                placeholder="Net 30"
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Customer Details Modal */}
      <Modal visible={showDetailsModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
              <Text style={styles.modalCancelText}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Customer Details</Text>
            <TouchableOpacity>
              <Text style={styles.modalSaveText}>Edit</Text>
            </TouchableOpacity>
          </View>

          {selectedCustomer && (
            <ScrollView style={styles.modalContent}>
              <Card style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Contact Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name:</Text>
                  <Text style={styles.detailValue}>{selectedCustomer.name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailValue}>{selectedCustomer.email}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone:</Text>
                  <Text style={styles.detailValue}>{selectedCustomer.phone}</Text>
                </View>
              </Card>

              <Card style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Financial Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Credit Limit:</Text>
                  <Text style={styles.detailValue}>{formatCurrency(selectedCustomer.creditLimit || 0)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Outstanding Balance:</Text>
                  <Text style={[
                    styles.detailValue,
                    { color: selectedCustomer.currentBalance > 0 ? colors.error : colors.success }
                  ]}>
                    {formatCurrency(selectedCustomer.currentBalance || 0)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Sales:</Text>
                  <Text style={styles.detailValue}>{formatCurrency(selectedCustomer.totalSales || 0)}</Text>
                </View>
              </Card>

              {selectedCustomer.currentBalance > 0 && (
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
            {selectedCustomer && (
              <Card style={styles.paymentCard}>
                <Text style={styles.paymentCustomer}>{selectedCustomer.name}</Text>
                <Text style={styles.paymentBalance}>
                  Outstanding: {formatCurrency(selectedCustomer.currentBalance || 0)}
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
  customerCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  customerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.gray[800],
    marginBottom: spacing.xs,
  },
  customerContact: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  customerEmail: {
    fontSize: 14,
    color: colors.gray[500],
  },
  customerStats: {
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
  customerDetails: {
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
    backgroundColor: colors.primary,
  },
  paymentCustomer: {
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

export default CustomersScreen; 