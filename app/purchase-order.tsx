import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Plus, Minus, Save } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';

interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  unit: string;
}

export default function PurchaseOrderScreen() {
  const { type } = useLocalSearchParams();
  const isCredit = type === 'credit';
  
  const [supplier, setSupplier] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [paidAmount, setPaidAmount] = useState('0');

  const availableItems = [
    { id: 1, name: 'Rice 25kg', price: 1200, unit: 'bag' },
    { id: 2, name: 'Cooking Oil 1L', price: 220, unit: 'bottle' },
    { id: 3, name: 'Sugar 1kg', price: 60, unit: 'packet' },
    { id: 4, name: 'Flour 25kg', price: 1800, unit: 'bag' },
  ];

  const addItem = (item: any) => {
    const existingItem = items.find(i => i.id === item.id);
    if (existingItem) {
      setItems(items.map(i => 
        i.id === item.id 
          ? { ...i, quantity: i.quantity + 1 }
          : i
      ));
    } else {
      setItems([...items, { ...item, quantity: 1 }]);
    }
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      setItems(items.filter(i => i.id !== id));
    } else {
      setItems(items.map(i => 
        i.id === id ? { ...i, quantity } : i
      ));
    }
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const formatCurrency = (amount: number) => {
    return `Birr ${amount.toLocaleString()}`;
  };

  const handleSave = () => {
    if (!supplier.trim()) {
      Alert.alert('Error', 'Please enter supplier name');
      return;
    }
    if (items.length === 0) {
      Alert.alert('Error', 'Please add at least one item');
      return;
    }

    const orderType = isCredit ? 'Credit Purchase Order' : 'Purchase Order';
    Alert.alert('Success', `${orderType} created successfully!`, [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={isCredit ? ['#f59e0b', '#d97706'] : ['#16a34a', '#15803d']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isCredit ? 'Create Credit Purchase Order' : 'Create Purchase Order'}
        </Text>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Supplier Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Supplier Information</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter supplier name"
            value={supplier}
            onChangeText={setSupplier}
          />
        </View>

        {/* Available Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Items</Text>
          {availableItems.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>{formatCurrency(item.price)} per {item.unit}</Text>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => addItem(item)}
              >
                <Plus size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Selected Items */}
        {items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Selected Items</Text>
            {items.map((item) => (
              <View key={item.id} style={styles.selectedItemCard}>
                <View style={styles.selectedItemInfo}>
                  <Text style={styles.selectedItemName}>{item.name}</Text>
                  <Text style={styles.selectedItemPrice}>
                    {formatCurrency(item.price)} × {item.quantity} = {formatCurrency(item.price * item.quantity)}
                  </Text>
                </View>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    <Minus size={16} color="#ffffff" />
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus size={16} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Total and Payment */}
            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>Total Amount:</Text>
              <Text style={styles.totalAmount}>{formatCurrency(calculateTotal())}</Text>
            </View>

            {isCredit && (
              <View style={styles.paymentSection}>
                <Text style={styles.paymentLabel}>Paid Amount (Credit Order):</Text>
                <TextInput
                  style={styles.paymentInput}
                  value={paidAmount}
                  onChangeText={setPaidAmount}
                  keyboardType="numeric"
                  placeholder="0"
                />
                <Text style={styles.remainingAmount}>
                  Remaining: {formatCurrency(calculateTotal() - (parseFloat(paidAmount) || 0))}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Save size={20} color="#ffffff" />
          <Text style={styles.saveButtonText}>Create Order</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  itemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#6b7280',
  },
  addButton: {
    backgroundColor: '#16a34a',
    borderRadius: 8,
    padding: 8,
  },
  selectedItemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedItemInfo: {
    flex: 1,
  },
  selectedItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  selectedItemPrice: {
    fontSize: 14,
    color: '#6b7280',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    backgroundColor: '#2563eb',
    borderRadius: 6,
    padding: 6,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    minWidth: 24,
    textAlign: 'center',
  },
  totalSection: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  paymentSection: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  paymentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 8,
  },
  paymentInput: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#d97706',
    marginBottom: 8,
  },
  remainingAmount: {
    fontSize: 14,
    color: '#92400e',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});