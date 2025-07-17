import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react'
import { useColorScheme } from 'react-native';
// add react qeury 
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../contexts/AuthContext';

const client = new QueryClient();
const _layout = () => {
    const colorScheme = useColorScheme();
    return (
      <QueryClientProvider client={client}>
          <AuthProvider>
          <Stack initialRouteName='login'>
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="otpScreen" options={{ headerShown: false }} />
            <Stack.Screen name="pinInput" options={{ headerShown: false }} />
            <Stack.Screen name="signup" options={{headerShown: false}} />
          </Stack>
          <StatusBar style="auto" />
          </AuthProvider>
        </QueryClientProvider>

      );
}

export default _layout