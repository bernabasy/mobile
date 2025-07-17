import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import styles from '../styles/SplashScreenStyles';

export default function SplashScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    setTimeout(() => {
      navigation.replace('Login');
    }, 2000);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Arif Sales</Text>
      <Text style={styles.subtitle}>Inventory Tracking Made Simple</Text>
    </View>
  );
}