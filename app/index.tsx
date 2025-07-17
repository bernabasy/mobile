import i18n from './config/i18n'; 
import { useRoute, useNavigation } from "@react-navigation/native";
import { NavigationContainer } from "@react-navigation/native";
import React, {useEffect} from "react";
import * as splashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";


// import i18n from '../config/i18n'; // Adjust the import path as necessary
// Update the path below to the correct location of your i18n configuration file
// import i18n from './i18n'; // Example: if i18n.ts is in the same folder as index.tsx
import { View } from "react-native";
import e from 'express';

export default function App() {
  const route = useRoute();
  const navigation = useNavigation();
  const router = useRouter();


  const checkLanguageAndToken = async () => {
    try {
      const lang = await AsyncStorage.getItem('lang');
      const token = await AsyncStorage.getItem('token');
      if (lang) {
        i18n.changeLanguage(lang);
        router.push('/home');
      } else if (token) {
        router.push('/dashboard');
      }
      } catch (error) {
        router.replace('/(auth)/login');
      console.error("Error checking language and token:", error);
    }
  };

  useEffect(() => {
    async function prepare() {
      try {
        // Keep the splash screen visible while we fetch resources
        await splashScreen.preventAutoHideAsync();
        
        // Load any necessary resources here, e.g., fonts, images, etc.
        // await loadResourcesAsync();
        
        // Check for language preference in AsyncStorage
        const lang = await AsyncStorage.getItem('lang');
        if (lang) {
          i18n.changeLanguage(lang);
        }
      } catch (e) {
        console.warn(e);
      } finally {
        // Hide the splash screen once everything is ready
        await splashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      {/* Your app's main component goes here */}
    </>
  );
}