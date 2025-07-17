import i18n from '@/i18n';
import { Text, StyleSheet, type TextProps, type StyleProp, TextStyle } from 'react-native';

// Define the interface for CustomTextProps
interface CustomTextProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'p' | 'xs';
  color?: string;
  align?: 'left' | 'center' | 'right'; // ✅ Added `align` prop
  style?: StyleProp<TextStyle>;
  children?: string | number;
  numberOfLines?: number; // ✅ Added `numberOfLines` prop
  translate?: boolean; // ✅ Added `translate` prop
}

const CustomText = ({
  children = '',
  variant = 'p',
  color = '#222031',
  align = 'left',
  style,
  numberOfLines, // ✅ Destructure `numberOfLines`
  translate = true, // ✅ Default value for `translate` is `true`
  ...rest
}: CustomTextProps) => {
  const variantStyles = getVariantStyles(variant);

  // Conditionally apply translation based on the `translate` prop
  const translatedText =
    typeof children === 'string' && translate ? i18n.t(children) : children;

  return (
    <Text
      style={[styles.base, variantStyles, { color, textAlign: align }, style]}
      numberOfLines={numberOfLines} // ✅ Pass `numberOfLines` to `Text`
      {...rest}
    >
      {translatedText}
    </Text>
  );
};

// Helper function to get styles based on the variant
const getVariantStyles = (variant: CustomTextProps['variant']): StyleProp<TextStyle> => {
  switch (variant) {
    case 'h1':
      return styles.h1;
    case 'h2':
      return styles.h2;
    case 'h3':
      return styles.h3;
    case 'xs':
      return styles.xs;
    case 'p':
    default:
      return styles.p;
  }
};

// StyleSheet definitions
const styles = StyleSheet.create({
  base: {
    fontFamily: 'Poppins_400Regular',
  },
  h1: {
    fontSize: 32,
    fontFamily: 'Poppins_700Bold',
  },
  h2: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
  },
  h3: {
    fontSize: 18,
    fontFamily: 'Poppins_500Medium',
  },
  p: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 24,
  },
  xs: {
    fontSize: 12,
  },
});

export default CustomText;