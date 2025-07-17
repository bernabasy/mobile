import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { AppRegistry } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import 'react-native-url-polyfill/auto';

// Import all screens
import CreditPurchaseScreen from "./screens/CreditPurchaseScreen";
import CreditSalesScreen from "./screens/CreditSalesScreen";
import CustomersScreen from "./screens/CustomersScreen";
import LowStockScreen from "./screens/LowStockScreen";
import MainHomeScreen from "./screens/MainHomeScreen";
import PurchaseOrderScreen from "./screens/PurchaseOrderScreen";
import PurchasesScreen from "./screens/PurchasesScreen";
import SalesOrderScreen from "./screens/SalesOrderScreen";
import SalesScreen from "./screens/SalesScreen";
import SettingsScreen from "./screens/SettingsScreen";
import ShopScreen from "./screens/ShopScreen";
import StockScreen from "./screens/StockScreen";
import SuppliersScreen from "./screens/SuppliersScreen";
import TodaysSalesScreen from "./screens/TodaysSalesScreen";

const Stack = createStackNavigator();

function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" backgroundColor="#ffffff" />
        <Stack.Navigator
          initialRouteName="MainHome"
          screenOptions={{
            headerShown: false,
            gestureEnabled: true,
            gestureDirection: "horizontal",
          }}
        >
          {/* Main screens */}
          <Stack.Screen 
            name="MainHome" 
            component={MainHomeScreen}
            options={{ title: "Inventory Management" }}
          />
          
          {/* Core inventory screens */}
          <Stack.Screen 
            name="Shop" 
            component={ShopScreen}
            options={{ title: "Shop Management" }}
          />
          <Stack.Screen 
            name="Stock" 
            component={StockScreen}
            options={{ title: "Stock Management" }}
          />
          <Stack.Screen 
            name="LowStock" 
            component={LowStockScreen}
            options={{ title: "Low Stock Alerts" }}
          />
          
          {/* Transaction screens */}
          <Stack.Screen 
            name="Purchases" 
            component={PurchasesScreen}
            options={{ title: "Purchases" }}
          />
          <Stack.Screen 
            name="Sales" 
            component={SalesScreen}
            options={{ title: "Sales" }}
          />
          <Stack.Screen 
            name="TodaysSales" 
            component={TodaysSalesScreen}
            options={{ title: "Today's Sales" }}
          />
          <Stack.Screen 
            name="CreditSales" 
            component={CreditSalesScreen}
            options={{ title: "Credit Sales" }}
          />
          <Stack.Screen 
            name="CreditPurchase" 
            component={CreditPurchaseScreen}
            options={{ title: "Credit Purchases" }}
          />
          
          {/* Order screens */}
          <Stack.Screen 
            name="SalesOrder" 
            component={SalesOrderScreen}
            options={{ title: "Sales Orders" }}
          />
          <Stack.Screen 
            name="PurchaseOrder" 
            component={PurchaseOrderScreen}
            options={{ title: "Purchase Orders" }}
          />
          
          {/* Contact management screens */}
          <Stack.Screen 
            name="Customers" 
            component={CustomersScreen}
            options={{ title: "Customers" }}
          />
          <Stack.Screen 
            name="Suppliers" 
            component={SuppliersScreen}
            options={{ title: "Suppliers" }}
          />
          
          {/* Settings screen */}
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{ title: "Settings" }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

// Register the app component
AppRegistry.registerComponent('main', () => App);

export default App;