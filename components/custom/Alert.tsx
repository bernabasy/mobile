import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  GestureResponderEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomText from './CustomText';
import { Colors } from '@/constants/Colors';

export type AlertButton = {
  text: string;
  onPress?: (event: GestureResponderEvent) => void;
  style?: 'default' | 'cancel' | 'destructive';
};

// Define the possible alert types
export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertState {
  visible: boolean;
  title?: string;
  message: string;
  buttons: AlertButton[];
  alertType?: AlertType; // Changed from icon?: string
}

let currentAlertState: AlertState = {
  visible: false,
  title: '',
  message: '',
  buttons: [],
  alertType: undefined, // Changed from icon: undefined
};

let listeners: ((state: AlertState) => void)[] = [];

const notifyListeners = () => {
  listeners.forEach(listener => listener(currentAlertState));
};

export const showAlert = (
  title: string | undefined,
  message: string,
  buttons?: AlertButton[],
  options?: {
    alertType?: AlertType; // Changed from icon?: string
  }
) => {
  const defaultButtons = buttons && buttons.length > 0 ? buttons : [{ text: 'OK' }];

  const processedButtons = defaultButtons.map(button => ({
    ...button,
    onPress: (event: GestureResponderEvent) => { // Added event type explicitly
      try {
        button.onPress?.(event); // Pass event
      } catch (error) {
        console.error("Error in alert button onPress handler:", error);
      } finally {
        closeAlert();
      }
    },
  }));

  currentAlertState = {
    visible: true,
    title,
    message,
    buttons: processedButtons,
    alertType: options?.alertType, // Use alertType
  };

  notifyListeners();
};

export const closeAlert = () => {
  currentAlertState.visible = false;
  notifyListeners();
};

// Helper function to get icon details based on type
const getIconDetails = (alertType?: AlertType): { name?: keyof typeof Ionicons.glyphMap; color?: string } => {
  switch (alertType) {
    case 'success':
      return { name: 'checkmark-circle', color: '#28a745' }; // Green
    case 'error':
      return { name: 'close-circle', color: '#dc3545' }; // Red
    case 'warning':
      return { name: 'warning', color: '#ffc107' }; // Yellow/Orange
    case 'info':
      return { name: 'information-circle', color: '#007AFF' }; // Blue
    default:
      return { name: undefined, color: undefined }; // No icon by default
  }
};

export const Alert = () => {
  const [alertData, setAlertData] = useState<AlertState>(currentAlertState);

  useEffect(() => {
    const listener = (state: AlertState) => {
      setAlertData({ ...state });
    };
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  if (!alertData.visible) return null;

  const { name: iconName, color: iconColor } = getIconDetails(alertData.alertType);

  return (
    <Modal visible={alertData.visible} transparent animationType="fade">
      <View style={styles.overlay}>

        <View style={styles.alertBox}>
          {(iconName || alertData.title) && ( // Check if iconName exists
            <View style={styles.titleRow}>
              {iconName && ( // Render icon only if name is defined
                <Ionicons
                  name={iconName}
                  size={52}
                  color={iconColor} // Use determined color
                  style={{ marginRight: 6 }}
                />
              )}
            </View>
          )}
         {alertData.title && <CustomText translate={false} variant="h3" >{alertData.title}</CustomText>}
          <CustomText variant="xs" translate={false} style={styles.message}>{alertData.message}</CustomText>
          <View style={styles.buttonContainer}>
            {alertData.buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  button.style === 'destructive' && styles.destructiveButton,
                ]}
                onPress={button.onPress}
              >
                <Text
                  style={[
                    styles.buttonText,
                    // Optional: Adjust button text color based on type?
                    // alertData.alertType === 'error' && button.style !== 'cancel' ? { color: iconColor } : {},
                    button.style === 'cancel' && styles.cancelButtonText,
                    button.style === 'destructive' && styles.destructiveButtonText,
                  ]}
                >
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBox: {
    width: '80%',
    alignItems: 'center',
    maxWidth: 400, // Added max width for better appearance on larger screens
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000', // Added shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12, // Increased margin
  },
  message: {
    color: '#3C3C43', // Slightly lighter dark color
    marginBottom: 24, // Increased margin
    lineHeight: 22, // Improved readability
    alignItems: 'center', // Center text horizontally
    textAlign: 'center', // Center text horizontally
    marginHorizontal: 12, // Added horizontal margin for better readability
    paddingHorizontal: 12, // Added horizontal padding for better readability
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // Align buttons to the right
    gap: 12,
    flexWrap: 'wrap', // Allow buttons to wrap on smaller screens if needed
  },
  button: {
    paddingHorizontal: 16, // Increased padding
    paddingVertical: 10, // Increased padding
    borderRadius: 20, // Slightly more rounded
    minWidth: 70, // Minimum width for buttons
    alignItems: 'center', // Center text horizontally
    backgroundColor: Colors.light.lightGray, // Default background for standard buttons
  },
  buttonText: {
    fontSize: 16, // Slightly larger text
    fontWeight: '500', // Medium weight
    color: Colors.dark.primary, // Default blue text
  },
  cancelButton: {
    backgroundColor: '#E5E5EA', // Lighter gray for cancel
  },
  cancelButtonText: {
    color: '#5856D6', // System purple-ish color for cancel text
    fontWeight: '600',
  },
  destructiveButton: {
    backgroundColor: '#FFEBEE', // Lighter red background
  },
  destructiveButtonText: {
    color: '#FF3B30', // System red color
    fontWeight: '600',
  },
});

export default Alert;