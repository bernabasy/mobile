import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  TextInput,
  Pressable,
  Platform,
  // Alert, // Keep standard Alert if needed elsewhere, otherwise remove
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/Colors'; // Assuming Colors definition
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { loginService } from '@/services/authServices';
import * as SecureStore from 'expo-secure-store'; // Or your preferred secure storage

// Removed: import ButtonComponent from '@/components/custom/CustomButton'; // No longer needed

const { width } = Dimensions.get('window');
const PIN_LENGTH = 6; // Define PIN length as a constant

const ModernPinInput = () => {
  const [pin, setPin] = useState<string[]>(Array(PIN_LENGTH).fill(''));
  const inputRefs = useRef<(TextInput | null)[]>([]); // Refs for TextInput
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get mobile number from route params
  const params = useLocalSearchParams();
  const mobile = params.mobile as string;

  console.log(mobile)
  const loginMutation = useMutation({
    mutationFn: loginService,
    onSuccess: async (data) => {

      console.log('Login successful:', );

      await SecureStore.setItemAsync(process.env.ACCESS_TOKEN_KEY||'cheche_access_token', data.data?.access_token);
      await SecureStore.setItemAsync(process.env.REFRESH_TOKEN_KEY|| 'cheche_refresh_token',data.data?.refresh_token)
      // Navigate to OTP screen with mobile number
      router.push({ pathname: '/(protected)/(tabs)/home', params: { mobile }});
    },
    onError: (error: any) => {
      // Reset PIN and submission state
      setPin(Array(PIN_LENGTH).fill(''));
      setIsSubmitting(false);
      inputRefs.current[0]?.focus();

      if (error && error.response) {
        const status = error.response.status;
        switch (status) {
          case 403:
            showAlert( // Use the imported showAlert function
              'Verification Required',
              'Your account needs verification. Please check your OTP.',
              [
                { text: 'OK', onPress: () => router.push({ pathname: '/(authscreen)/otpScreen', params: { mobile }}) },
                

              ],
              {alertType: 'warning'}
            );
            break;
          case 404:
            showAlert(
              'Account Not Found',
              'No account found with this mobile number. Please sign up.',
              [
                { text: 'Sign Up', onPress: () => router.push({ pathname: '/(authscreen)/signup'}) },
              ]
              ,{alertType: 'warning'}

            );
            break;
           case 401:
            showAlert(
              'Invalid Credentials',
              'The PIN you entered is incorrect. Please try again.',
              [
                { text: 'OK', onPress: () => {} }
              ]
            ,
              {alertType: 'warning'}
            ) 
            break;
          default:
            showAlert(
              'Login Failed',
              `An unexpected error occurred (Status: ${status}). Please try again.`,
              [
                { text: 'OK', onPress: () => router.push({ pathname: '/(authscreen)/login'}) }
              ]
              ,
              {alertType: 'warning'}
            );
        }
      } else {
        showAlert(
          'Login Error',
          'An unknown error occurred. Please check your connection and try again.',
          [
             { text: 'OK', onPress: () => router.push({ pathname: '/(authscreen)/login'}) }
          ]
          ,
          {alertType: 'warning'}
        );
      }
    },
  });

  // Focus the first input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
       inputRefs.current[0]?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // --- Effect to handle automatic submission when PIN is complete ---
  useEffect(() => {
    const fullPin = pin.join('');
    if (fullPin.length === PIN_LENGTH && !isSubmitting) {
       // *** Automatically submit when full ***
       handlePinSubmit(fullPin);
    }
     // Reset submit flag if pin length decreases (e.g., user uses backspace)
     if (fullPin.length < PIN_LENGTH && isSubmitting) {
        setIsSubmitting(false);
     }
  }, [pin, isSubmitting]); // Depend on pin and isSubmitting


  const handlePinChange = (text: string, index: number) => {
    // Allow only single digit numeric input
    const digit = text.slice(-1).replace(/[^0-9]/g, ''); // Get last char, ensure it's a digit

    // No need to check digit !== pin[index] because the hidden input's value
    // is controlled and onChangeText fires even if the value is programmatically set back to ''.
    const newPin = [...pin];
    newPin[index] = digit;
    setPin(newPin);

    // Move focus to the next input if a digit was entered
    if (digit && index < PIN_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    event: React.SyntheticEvent<TextInput, { key: string }>, // Correct event type might be NativeSyntheticEvent<TextInputKeyPressEventData> depending on RN version
    index: number
  ) => {
    if (event.nativeEvent.key === 'Backspace') {
      // No explicit digit clearing here needed for Backspace *if* onChangeText handles it correctly.
      // However, we need to move focus *back* if the current input is already empty.
      if (pin[index] === '' && index > 0) {
        // Clear the previous digit as well when moving focus back via backspace
        // (This provides a more intuitive feel like a standard PIN field)
        // const newPin = [...pin]; // Get a fresh copy
        // newPin[index - 1] = '';
        // setPin(newPin); // Update state first
        inputRefs.current[index - 1]?.focus(); // Then move focus
      }
      // Note: handlePinChange('') will be triggered by the TextInput itself when backspace clears the digit.
    }
  };


  // Handle numpad button press
  const handleNumberPress = (number: string) => {
    const firstEmptyIndex = pin.findIndex((digit) => digit === '');
    if (firstEmptyIndex !== -1 && !isSubmitting) { // Prevent input during submission
      handlePinChange(number, firstEmptyIndex); // Update the first empty slot
      // Focus logic is handled within handlePinChange
    }
  };

  // Handle Numpad backspace press
  const handleBackspacePress = () => {
     if (isSubmitting) return; // Prevent action during submission

    // Find the index of the *last* character entered
    let lastFilledIndex = pin.length - 1;
    while(lastFilledIndex >= 0 && pin[lastFilledIndex] === '') {
        lastFilledIndex--;
    }

     if (lastFilledIndex >= 0) {
        const newPin = [...pin];
        newPin[lastFilledIndex] = '';
        setPin(newPin);
        // Focus the input that was just cleared
        inputRefs.current[lastFilledIndex]?.focus();
     } else {
        // If all are empty, focus the first input
        inputRefs.current[0]?.focus();
     }
  };

  // --- Submission Logic ---
  const handlePinSubmit = async (submittedPin: string) => {
     // Redundant check (covered by useEffect), but good safeguard
     if (submittedPin.length !== PIN_LENGTH || isSubmitting) return;

     setIsSubmitting(true);
     console.log('PIN submitting automatically:', submittedPin);

     try {
         // Use the loginMutation to authenticate with PIN and mobile
         loginMutation.mutate({
           pin: submittedPin,
           mobile: mobile
         });
         
         // Note: Success and error handling is now managed by the mutation callbacks
         // The component might unmount on successful navigation
         
     } catch (error) {
         console.error("Submission error:", error);
         // Handle error, e.g., show an error message
         showAlert(
             'Submission Error',
             'An error occurred during submission. Please try again.',
             [
                 { text: 'OK', onPress: () => router.push({ pathname: '/(authscreen)/login'}) }
             ]
         );
         setPin(Array(PIN_LENGTH).fill('')); // Clear PIN on error
         setIsSubmitting(false); // Reset flag on error
         inputRefs.current[0]?.focus(); // Focus first input again
     }
  };

  // --- Removed handleClear function ---

  // --- Numpad Buttons Configuration ---
  // Replace 'clear' with an empty string '' for layout placeholder
  const numpadKeys = [1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'backspace']; // 'clear' removed, '' added

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          {/* Use CustomText if available, otherwise fallback to Text */}
          {CustomText ? (
            <>
              <CustomText variant="h2" translate={false}>
                Enter Your PIN
              </CustomText>
              <CustomText variant="p" translate={false}>
                {`Please enter your ${PIN_LENGTH}-digit security PIN.`}
              </CustomText>
            </>
          ) : (
            <>
              <CustomText variant="h3" translate={false}   >Enter Your PIN</CustomText>
              <CustomText  variant="p" translate={false}>
                Please enter your {PIN_LENGTH}-digit security PIN.
              </CustomText>
            </>
          )}
        </View>

        {/* PIN Input Display */}
        <View style={styles.pinContainer}>
          {pin.map((digit, index) => (
            <View key={index} style={styles.pinInputWrapper}>
               {/* Hidden TextInput */}
              <TextInput
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={styles.hiddenInput}
                keyboardType="numeric"
                maxLength={1}
                caretHidden
                value={digit}
                onChangeText={(text) => handlePinChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e as any, index)} // Cast event type if needed
                selectTextOnFocus={false}
                contextMenuHidden
                showSoftInputOnFocus={false}
                // Make input focusable even when disabled (useful for error states)
                editable={!isSubmitting} // Disable input during submission
              />
              {/* Visual representation */}
              <Pressable
                style={[
                  styles.pinDisplay,
                  digit ? styles.pinFilled : styles.pinEmpty,
                  // Optionally dim the dots during submission
                  isSubmitting && styles.pinDisplaySubmitting,
                ]}
                onPress={() => !isSubmitting && inputRefs.current[index]?.focus()} // Allow focusing only if not submitting
                disabled={isSubmitting}
              >
                {/* Dots preferred over numbers */}
                {/* <Text style={styles.pinText}>{digit ? '●' : ''}</Text> */}
              </Pressable>
            </View>
          ))}
        </View>

         {/* Numpad - Disable buttons during submission */}
         <View style={styles.numpadContainer}>
          {numpadKeys.map((item, index) => (
            <Pressable
              key={index}
              style={({ pressed }) => [
                styles.numpadButton,
                // Make empty slot visually distinct and non-interactive
                item === '' ? styles.numpadButtonEmpty : null,
                // Apply pressed style only if it's not the empty slot and not submitting
                pressed && item !== '' && !isSubmitting ? styles.numpadButtonPressed : null,
                // Visually indicate disabled state
                isSubmitting && item !== '' ? styles.numpadButtonDisabled : null,
              ]}
              // Disable interaction for empty slots or during submission
              disabled={item === '' || isSubmitting}
              onPress={() => {
                // No action if submitting or empty slot
                if (isSubmitting || item === '') return;

                if (typeof item === 'number') {
                  handleNumberPress(item.toString());
                } else if (item === 'backspace') {
                  handleBackspacePress();
                }
                // No 'clear' case anymore
              }}
            >
              {item === 'backspace' ? (
                <Ionicons
                    name="backspace-outline"
                    size={28}
                    color={isSubmitting ? Colors.dark.lightGray : Colors.dark.text} // Dim icon when disabled
                />
              ) : item === '' ? null : ( // Render nothing for the empty slot
                <CustomText
                    variant="h2"
                    color={isSubmitting ? Colors.dark.lightGray : Colors.dark.text}
                    align='center'
                >
                    {item}
                </CustomText>
              )}
            </Pressable>
          ))}
        </View>
         {/* Optional: Add a visual indicator for submission in progress */}
         {isSubmitting && (
            <View style={styles.loadingIndicator}>
                <CustomText variant="p" style={{ color: Colors.dark.primary }} translate={false}>Verifying PIN...</CustomText>
                {/* You could add an ActivityIndicator here */}
            </View>
         )}

      </View>
    </SafeAreaView>
  );
};

// --- Styles (Assume Colors and CustomText are defined/imported correctly) ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background, // Use a defined color
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  // Example styles if CustomText variants aren't fully defined
  h2: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 8,
  },
  p: {
     fontSize: 16,
     color: Colors.dark.text,
     opacity: 0.7,
     textAlign: 'center',
  },
  title: { // Fallback if CustomText is not used
    fontSize: 24,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 8,
  },
  subtitle: { // Fallback if CustomText is not used or variant='p' doesn't have these styles
    fontSize: 16,
    color: Colors.dark.text,
    opacity: 0.7,
    textAlign: 'center',
  },
  pinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    height: 50, // Give container height for alignment
  },
   pinInputWrapper: {
      marginHorizontal: 8,
      position: 'relative',
      width: 30,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
   },
   hiddenInput: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      opacity: 0,
      color: 'transparent',
      backgroundColor: 'transparent',
      fontSize: 1,
      borderWidth: 0,
      padding: 0,
      margin: 0,
      // Ensure it can receive focus even if opacity is 0
      zIndex: 1,
   },
  pinDisplay: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    // Ensure Pressable doesn't block hidden input
    zIndex: 0,
  },
  pinEmpty: {
    backgroundColor: Colors.light.text + '30',
    borderWidth: 1,
    borderColor: Colors.dark.primary + '50',
  },
  pinFilled: {
    backgroundColor: Colors.dark.primary,
  },
  pinDisplaySubmitting: {
    opacity: 0.5, // Dim dots during submission
  },
  numpadContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 300,
    marginBottom: 30,
  },
  numpadButton: {
    width: 75,
    height: 75,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
    borderRadius: 37.5,
    backgroundColor: Colors.light.gray || '#E5E7EB', // Provide fallback color
    borderWidth: Platform.OS === 'ios' ? StyleSheet.hairlineWidth : 1, // Hairline border on iOS
    borderColor: Colors.dark.lightGray || '#D1D5DB', // Provide fallback color
  },
  numpadButtonPressed: {
    backgroundColor: Colors.light.text + '1A', // Slightly darker feedback
  },
   numpadButtonDisabled: { // Style for disabled numpad buttons
      // backgroundColor: Colors.light.gray + '80', // Example: Slightly dimmed background
      opacity: 0.6, // Make buttons look faded
   },
  numpadButtonText: {
    color: Colors.dark.text,
    justifyContent:"center",
    alignItems: "center",
    alignSelf: "center"
  },
   numpadButtonEmpty: { // Style for the placeholder spot
    backgroundColor: 'transparent',
    borderColor: 'transparent', // Make border invisible too
    elevation: 0, // Remove shadow on Android if any
    shadowOpacity: 0, // Remove shadow on iOS if any
   },
   loadingIndicator: {
       marginTop: 20, // Space above indicator
       alignItems: 'center',
   },
  // Removed styles associated with the old Submit and Clear buttons
});

export default ModernPinInput;
import CustomAlert, { showAlert } from '@/components/custom/Alert';import CustomText from '@/components/custom/CustomText';
 // Import the custom Alert