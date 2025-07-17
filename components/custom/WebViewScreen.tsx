import React, { useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';

interface WebViewScreenProps {
  url: string;
  title?: string;
}

export default function WebViewScreen({ url, title = 'Appointment' }: WebViewScreenProps) {
  const [isLoading, setIsLoading] = useState(true);

  const injectedJavaScript = `
    try {
      localStorage.setItem('token', 'your-token-here');
      true;
    } catch (err) {
      console.error('Error setting token:', err);
    }
  `;

  return (
    <>
      <Stack.Screen 
        options={{
          title: title,
          headerStyle: {
            backgroundColor: Colors.light.background,
          },
          headerTintColor: Colors.light.text,
          headerShadowVisible: false,
        }}
      />
      <View style={styles.container}>
        <WebView 
          source={{ uri: url }}
          style={styles.webview}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          injectedJavaScript={injectedJavaScript}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('WebView error:', nativeEvent);
          }}
        />
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
}); 