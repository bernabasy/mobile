import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

const Skeleton = () => {
  return (
    <View style={styles.skeletonContainer}>
      {[...Array(8)].map((_, index) => (
        <View key={index} style={styles.skeletonItem}>
          <View style={styles.skeletonIcon} />
          <View style={styles.skeletonText} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeletonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  skeletonItem: {
    width: '25%',
    marginBottom: 16,
    padding: 12,
    alignItems: 'center',
  },
  skeletonIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.light.lightGray,
    marginBottom: 8,
  },
  skeletonText: {
    width: 50,
    height: 8,
    marginTop: 4,
    backgroundColor: Colors.light.lightGray,
    borderRadius: 5,
  },
});

export default Skeleton;