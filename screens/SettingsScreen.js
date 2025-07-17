import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Card from "../components/Card";
import {
    borderRadius,
    colors,
    globalStyles,
    spacing,
} from "../styles/theme";

const SettingsScreen = ({ navigation }) => {
  const [settings, setSettings] = useState({
    taxEnabled: false,
    taxRate: "15",
    withholdingEnabled: false,
    withholdingRate: "2",
    defaultPaymentMethod: "cash",
    lowStockThreshold: "10",
    batchPricingMethod: "FIFO",
    autoBackup: true,
    offlineMode: true,
    notifications: {
      lowStock: true,
      paymentDue: true,
      stockCount: false,
    },
    currency: "Birr",
    language: "English",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const savedSettings = await AsyncStorage.getItem("appSettings");
      if (savedSettings) {
        setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  }, []);

  const saveSettings = useCallback(async () => {
    try {
      setLoading(true);
      await AsyncStorage.setItem("appSettings", JSON.stringify(settings));
      Alert.alert("Success", "Settings saved successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      Alert.alert("Error", "Failed to save settings");
    } finally {
      setLoading(false);
    }
  }, [settings]);

  const updateSetting = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateNotificationSetting = useCallback((key, value) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value }
    }));
  }, []);

  const resetToDefaults = useCallback(() => {
    Alert.alert(
      "Reset Settings",
      "Are you sure you want to reset all settings to default values?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            setSettings({
              taxEnabled: false,
              taxRate: "15",
              withholdingEnabled: false,
              withholdingRate: "2",
              defaultPaymentMethod: "cash",
              lowStockThreshold: "10",
              batchPricingMethod: "FIFO",
              autoBackup: true,
              offlineMode: true,
              notifications: {
                lowStock: true,
                paymentDue: true,
                stockCount: false,
              },
              currency: "Birr",
              language: "English",
            });
          },
        },
      ]
    );
  }, []);

  const SettingRow = useCallback(({ label, children, description }) => (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description && <Text style={styles.settingDescription}>{description}</Text>}
      </View>
      <View style={styles.settingControl}>
        {children}
      </View>
    </View>
  ), []);

  const SwitchSetting = useCallback(({ label, value, onValueChange, description }) => (
    <SettingRow label={label} description={description}>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.gray[300], true: colors.primary }}
        thumbColor={value ? colors.white : colors.gray[100]}
      />
    </SettingRow>
  ), []);

  const InputSetting = useCallback(({ label, value, onChangeText, placeholder, keyboardType, description, suffix }) => (
    <SettingRow label={label} description={description}>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.settingInput, suffix && { paddingRight: spacing.xl }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          keyboardType={keyboardType}
          placeholderTextColor={colors.gray[400]}
        />
        {suffix && <Text style={styles.inputSuffix}>{suffix}</Text>}
      </View>
    </SettingRow>
  ), []);

  const SelectSetting = useCallback(({ label, options, value, onSelect, description }) => (
    <SettingRow label={label} description={description}>
      <View style={styles.selectContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.selectOption,
              value === option.value && styles.selectOptionSelected
            ]}
            onPress={() => onSelect(option.value)}
          >
            <Text style={[
              styles.selectOptionText,
              value === option.value && styles.selectOptionTextSelected
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SettingRow>
  ), []);

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
        <Text style={styles.headerTitle}>Settings</Text>
        <TouchableOpacity onPress={saveSettings} disabled={loading}>
          <Text style={[styles.saveText, loading && { color: colors.gray[400] }]}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Tax & Financial Settings */}
        <Card style={styles.settingCard}>
          <Text style={styles.cardTitle}>Tax & Financial</Text>
          
          <SwitchSetting
            label="Enable Tax"
            value={settings.taxEnabled}
            onValueChange={(value) => updateSetting('taxEnabled', value)}
            description="Apply tax to purchases and sales"
          />

          {settings.taxEnabled && (
            <InputSetting
              label="Tax Rate"
              value={settings.taxRate}
              onChangeText={(text) => updateSetting('taxRate', text)}
              placeholder="15"
              keyboardType="numeric"
              suffix="%"
              description="Default tax rate for transactions"
            />
          )}

          <SwitchSetting
            label="Enable Withholding"
            value={settings.withholdingEnabled}
            onValueChange={(value) => updateSetting('withholdingEnabled', value)}
            description="Apply withholding tax to transactions"
          />

          {settings.withholdingEnabled && (
            <InputSetting
              label="Withholding Rate"
              value={settings.withholdingRate}
              onChangeText={(text) => updateSetting('withholdingRate', text)}
              placeholder="2"
              keyboardType="numeric"
              suffix="%"
              description="Default withholding tax rate"
            />
          )}

          <SelectSetting
            label="Default Payment Method"
            value={settings.defaultPaymentMethod}
            onSelect={(value) => updateSetting('defaultPaymentMethod', value)}
            description="Default payment method for new transactions"
            options={[
              { label: "Cash", value: "cash" },
              { label: "Bank", value: "bank" },
              { label: "Check", value: "check" },
            ]}
          />
        </Card>

        {/* Inventory Settings */}
        <Card style={styles.settingCard}>
          <Text style={styles.cardTitle}>Inventory</Text>
          
          <InputSetting
            label="Low Stock Threshold"
            value={settings.lowStockThreshold}
            onChangeText={(text) => updateSetting('lowStockThreshold', text)}
            placeholder="10"
            keyboardType="numeric"
            description="Default minimum stock level for alerts"
          />

          <SelectSetting
            label="Batch Pricing Method"
            value={settings.batchPricingMethod}
            onSelect={(value) => updateSetting('batchPricingMethod', value)}
            description="Inventory valuation method"
            options={[
              { label: "FIFO", value: "FIFO" },
              { label: "LIFO", value: "LIFO" },
              { label: "Average", value: "AVERAGE" },
            ]}
          />
        </Card>

        {/* Notifications */}
        <Card style={styles.settingCard}>
          <Text style={styles.cardTitle}>Notifications</Text>
          
          <SwitchSetting
            label="Low Stock Alerts"
            value={settings.notifications.lowStock}
            onValueChange={(value) => updateNotificationSetting('lowStock', value)}
            description="Get notified when items are low in stock"
          />

          <SwitchSetting
            label="Payment Due Alerts"
            value={settings.notifications.paymentDue}
            onValueChange={(value) => updateNotificationSetting('paymentDue', value)}
            description="Get notified about upcoming payment due dates"
          />

          <SwitchSetting
            label="Stock Count Reminders"
            value={settings.notifications.stockCount}
            onValueChange={(value) => updateNotificationSetting('stockCount', value)}
            description="Get reminded to perform regular stock counts"
          />
        </Card>

        {/* Data & Sync */}
        <Card style={styles.settingCard}>
          <Text style={styles.cardTitle}>Data & Sync</Text>
          
          <SwitchSetting
            label="Auto Backup"
            value={settings.autoBackup}
            onValueChange={(value) => updateSetting('autoBackup', value)}
            description="Automatically backup data to cloud when online"
          />

          <SwitchSetting
            label="Offline Mode"
            value={settings.offlineMode}
            onValueChange={(value) => updateSetting('offlineMode', value)}
            description="Enable offline functionality for core features"
          />
        </Card>

        {/* Regional Settings */}
        <Card style={styles.settingCard}>
          <Text style={styles.cardTitle}>Regional</Text>
          
          <SelectSetting
            label="Currency"
            value={settings.currency}
            onSelect={(value) => updateSetting('currency', value)}
            description="Display currency for all amounts"
            options={[
              { label: "Ethiopian Birr", value: "Birr" },
              { label: "US Dollar", value: "USD" },
              { label: "Euro", value: "EUR" },
            ]}
          />

          <SelectSetting
            label="Language"
            value={settings.language}
            onSelect={(value) => updateSetting('language', value)}
            description="App display language"
            options={[
              { label: "English", value: "English" },
              { label: "Amharic", value: "Amharic" },
            ]}
          />
        </Card>

        {/* Actions */}
        <Card style={styles.settingCard}>
          <Text style={styles.cardTitle}>Actions</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={resetToDefaults}>
            <Ionicons name="refresh" size={20} color={colors.warning} />
            <Text style={styles.actionButtonText}>Reset to Defaults</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="download" size={20} color={colors.info} />
            <Text style={styles.actionButtonText}>Export Data</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="cloud-upload" size={20} color={colors.success} />
            <Text style={styles.actionButtonText}>Sync Now</Text>
          </TouchableOpacity>
        </Card>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
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
  saveText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  settingCard: {
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.gray[800],
    marginBottom: spacing.md,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.gray[800],
    marginBottom: spacing.xs,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.gray[600],
    lineHeight: 20,
  },
  settingControl: {
    alignItems: "flex-end",
  },
  inputContainer: {
    position: "relative",
    minWidth: 100,
  },
  settingInput: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    backgroundColor: colors.white,
    color: colors.gray[800],
    textAlign: "right",
    minWidth: 80,
  },
  inputSuffix: {
    position: "absolute",
    right: spacing.md,
    top: "50%",
    transform: [{ translateY: -10 }],
    fontSize: 16,
    color: colors.gray[600],
  },
  selectContainer: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  selectOption: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.gray[300],
    backgroundColor: colors.white,
  },
  selectOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  selectOptionText: {
    fontSize: 14,
    color: colors.gray[700],
    fontWeight: "500",
  },
  selectOptionTextSelected: {
    color: colors.white,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  actionButtonText: {
    fontSize: 16,
    color: colors.gray[800],
    marginLeft: spacing.md,
    fontWeight: "500",
  },
});

export default SettingsScreen;

 