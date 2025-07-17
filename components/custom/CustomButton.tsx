import { Colors } from '@/constants/Colors';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { ComponentProps } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';

/**
 * @param {*, title, handleShowModal} param0
 * @returns returns a customizable button with filled or outlined variants.
 */
export type ButtonProps = {
  title?: string;
  value?: any;
  handleButtonPress: (value: any) => void;
  shadow?: boolean;
  fontColor?: string;
  borderColor?: string;
  backgroundColor?: string;
  justifyContent?: 'center' | 'space-between' | 'space-around' | 'flex-start' | 'flex-end';
  loading?: boolean;
  iconName?: ComponentProps<typeof FontAwesome>['name'];
  iconColor?: string;
  fontSize?: number;
  height?: number;
  minWidth?: number;
  disabled?: boolean;
  variant?: 'filled' | 'outlined'; // New prop for button variant
};

const ButtonComponent = ({
  title,
  value,
  handleButtonPress,
  shadow,
  fontColor,
  borderColor,
  backgroundColor,
  justifyContent,
  loading,
  iconName,
  iconColor,
  fontSize,
  height,
  minWidth,
  disabled,
  variant = 'filled', // Default to 'filled' variant
}: ButtonProps) => {
  const isOutlined = variant === 'outlined';

  return (
    <View>
      <TouchableOpacity
        onPress={() => handleButtonPress(value)}
        disabled={loading || disabled}
      >
        <LinearGradient
          colors={
            isOutlined
              ? ['#ffcaf2', '#fed5f5'] // Transparent background for outlined buttons
              : [backgroundColor || Colors.dark.primary, '#DE3163']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.buttonContainer,
            {
              height: height || 50,
              borderWidth: isOutlined ? 1 : 0.5, // Increase border width for outlined buttons
              borderColor: borderColor || Colors.dark.gray,
              borderRadius: 25,
              marginVertical: 2,
              alignItems: 'center',
              justifyContent: justifyContent || 'center',
              shadowRadius: 15,
              shadowColor: borderColor,
              shadowOpacity: shadow ? 0.2 : 0,
              shadowOffset: { width: 0, height: -2 },
              paddingHorizontal: 18,
              minWidth: minWidth || 60,
              marginBottom: 10,
              opacity: disabled ? 0.6 : 1,
              backgroundColor: isOutlined ? 'transparent' : backgroundColor || Colors.dark.secondary, // Transparent bg for outlined buttons
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator size={22} color={isOutlined ? borderColor || Colors.dark.secondary : '#fff'} />
          ) : (
            <>
              {title && (
                <Text
                  style={[
                    styles.textStyle,
                    {
                      fontSize: fontSize || 18,
                      color: isOutlined ? borderColor || Colors.dark.primary : fontColor || '#fff',
                      fontFamily: 'Poppins_700Bold',
                    },
                  ]}
                >
                  {title}
                </Text>
              )}
              {iconName && (
                <FontAwesome
                  name={iconName}
                  color={isOutlined ? borderColor || Colors.dark.secondary : iconColor || '#fff'}
                  size={20}
                />
              )}
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: 'row',
  },
  textStyle: {
    textAlign: 'center',
  },
});

export default ButtonComponent;