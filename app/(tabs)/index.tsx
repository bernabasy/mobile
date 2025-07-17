import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, Package, Users, ShoppingCart, AlertTriangle, DollarSign } from 'lucide-react-native';
import { router } from 'expo-router';

export default function HomeScreen() {
  const stats = {
    inventoryValue: 68800,
    todaySales: 1250,
    lowStockItems: 3,
    totalCredit: 8750,
    totalDebit: 12500,
  };

  const formatCurrency = (amount: number) => {
    return `Birr ${amount.toLocaleString()}`;
  };

  const QuickActionCard = ({ title, subtitle, icon: Icon, color, onPress }: any) => (
    <TouchableOpacity onPress={onPress} style={styles.quickActionCard}>
      <LinearGradient colors={color} style={styles.quickActionGradient}>
        <View style={styles.quickActionContent}>
          <Text style={styles.quickActionTitle}>{title}</Text>
          <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
        </View>
        <Icon size={32} color="#ffffff" />
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#16a34a', '#15803d']} style={styles.header}>
        <Text style={styles.headerTitle}>INVENTORY VALUE</Text>
        <Text style={styles.headerAmount}>
          {formatCurrency(stats.inventoryValue)}
        </Text>
      </LinearGradient>

      {/* Quick Actions Grid */}
      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
        <View style={styles.quickActionsGrid}>
          <QuickActionCard
            title="PURCHASES"
            subtitle={`Credit: ${formatCurrency(stats.totalCredit)}`}
            icon={ShoppingCart}
            color={['#2563eb', '#1d4ed8']}
            onPress={() => router.push('/(tabs)/purchases')}
          />
          <QuickActionCard
            title="INVENTORY"
            subtitle="Manage Stock"
            icon={Package}
            color={['#7c3aed', '#6d28d9']}
            onPress={() => router.push('/(tabs)/inventory')}
          />
          <QuickActionCard
            title="CUSTOMERS"
            subtitle={`Debit: ${formatCurrency(stats.totalDebit)}`}
            icon={Users}
            color={['#dc2626', '#b91c1c']}
            onPress={() => router.push('/(tabs)/customers')}
          />
          <QuickActionCard
            title="TODAY'S SALES"
            subtitle={formatCurrency(stats.todaySales)}
            icon={TrendingUp}
            color={['#059669', '#047857']}
            onPress={() => console.log('Navigate to today sales')}
          />
        </View>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>OVERVIEW</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <AlertTriangle size={24} color="#f59e0b" />
            </View>
            <Text style={styles.statValue}>{stats.lowStockItems}</Text>
            <Text style={styles.statLabel}>Low Stock Items</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <DollarSign size={24} color="#10b981" />
            </View>
            <Text style={styles.statValue}>{formatCurrency(stats.todaySales)}</Text>
            <Text style={styles.statLabel}>Today's Sales</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 32,
    paddingTop: 60,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  headerAmount: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  quickActionsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  quickActionsGrid: {
    gap: 16,
  },
  quickActionCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  quickActionGradient: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    color: '#ffffff',
    fontSize: 14,
    opacity: 0.9,
  },
  statsSection: {
    padding: 20,
    paddingTop: 0,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statIcon: {
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
});