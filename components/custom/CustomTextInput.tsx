import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

const styles = StyleSheet.create({
  inputContainer: {
    width: '100%',
    height: 52,
    borderColor: '#fff',
    borderRadius: 50,
    paddingHorizontal: 20,
  },
  container: {
    height: 52,
    borderWidth: 1,
    borderColor: Colors.dark.icon,
    borderRadius: 26,
    marginBottom: 10,
    flexDirection: 'row',
  },
  label: {
    fontSize: 12,
    position: 'absolute',
    marginHorizontal: 15,
    marginVertical: 1,
    borderRadius: 50,
    color: Colors.dark.gray
  },
});


type CustomTextInputProps = {
  label: string;
  value?: string;
  onChangeHandler?: (text: string) => void;
  password?: boolean;
  length?: number;
  required?: boolean;
  onValidation?: (isValid: boolean) => void;
  pattern?: RegExp;
  errorSignal?: boolean;
  keyboardType?: 'default' | 'number-pad' | 'email-address' | 'phone-pad' | 'numeric' | 'decimal-pad';
  disabled?: boolean;
};



const CustomTextInput: React.FC<CustomTextInputProps>
 = ({
  label,
  value,
  onChangeHandler,
  password,
  length,
  required,
  onValidation,
  pattern,
  errorSignal,
  keyboardType,
  disabled,
}) => {
  const [showPassword, setShowPassword] = useState(!password);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const onFocus = () => {
    setIsInputFocused(true);
  };

  const onBlur = () => {
    setIsInputFocused(false);
  };

  const handleValidation = (value1:any) => {
    if (!pattern) return true;
    // Same validation logic from before...
    if (value1.length === 0) {
      return false;
    }
    return pattern.test(value1);

  };

  const onChange = (text:any) => {
    const isValid = handleValidation(text);
    if (onValidation) {
      onValidation(isValid);
    }
    if (onChangeHandler) {
      onChangeHandler(text);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.inputContainer}
        placeholderTextColor={Colors.dark.icon}
        placeholder={!isInputFocused || value ? label : undefined}
        value={value}
        onChangeText={onChange}
        maxLength={length || 50}
        secureTextEntry={!showPassword}
        onFocus={onFocus}
        onBlur={onBlur}
        keyboardType={keyboardType}
        disabled={disabled  || false}
      />
      {label
        && (isInputFocused || value ? (
          <Text style={styles.label}>
            {label}
            {'  '}
            {required ? <Text style={{ color: Colors.dark.danger }}>*</Text> : null}
          </Text>
        ) : null)}
      {password && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            alignSelf: 'center',
            left: '90%',
          }}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Ionicons
            name={showPassword ? 'eye-outline' : 'eye-off-outline'}
            size={24}
            color="#c2c2c2"
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default CustomTextInput;
