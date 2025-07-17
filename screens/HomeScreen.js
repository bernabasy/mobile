import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import styles from '../styles/HomeScreenStyles';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Arif Sales</Text>
        <Ionicons name="log-out-outline" size={28} color={styles.headerTitle.color} />
      </View>

      <Text style={styles.welcome}>Welcome to Your Inventory</Text>
      <Text style={styles.subtitle}>
        Track and manage your stock with ease.
      </Text>

      <View style={styles.card}>
        <Ionicons name="cube-outline" size={40} color={styles.cardTitle.color} />
        <Text style={styles.cardTitle}>Inventory Overview</Text>
        <Text style={styles.cardSubtitle}>View your stock levels</Text>
        <TouchableOpacity style={styles.cardButton}>
          <Text style={styles.cardButtonText}>Explore</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
