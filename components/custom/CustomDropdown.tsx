import React, { useState } from 'react';
import { StyleSheet, Text, View, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import i18n from '../../i18n';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

const styles = StyleSheet.create({
  dropdown: {
    borderWidth: 1,
    paddingHorizontal: 8,
  },
  icon: {
    marginRight: 5,
  },
  label: {
    position: 'absolute',
    left: 22,
    top: 10,
    zIndex: 999,
    paddingHorizontal: 8,
    fontSize: 12,
  },
  placeholderStyle: {
    fontSize: 12,
    margin: 5,
  },
  selectedTextStyle: {
    fontSize: 12,
    paddingHorizontal: 10,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 12,
  },
});

// Define types for the dropdown data
type DropdownData = {
  label: string;
  value: string;
};

export type CustomDropdownProps = {
  value?: string;
  handleCategoryChange: (text: string) => void;
  data: DropdownData[];
  title: string;
  background?: string;
  searchbar?: boolean;
  borderColor?: string;
  borderRadius?: number;
  width?: string | number;
  height?: number;
  margin?: number;
  isFilter?: boolean;
  color?: string;
  isLeftIcon?: boolean;
  withOutLabel?: boolean;
  iconColor?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;

};

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  value,
  handleCategoryChange,
  data,
  title,
  background,
  searchbar,
  borderColor,
  borderRadius,
  width,
  height,
  margin,
  isLeftIcon,
  color,
  withOutLabel,
  iconColor,
  style,
  textStyle,
}) => {
  const [isFocus, setIsFocus] = useState(false);
  const [settedValue, setSettedValue] = useState<string>('');
console.log(i18n.t(`${title}`))


  return (
    <View
      style={[
        {
          backgroundColor: background,
          marginBottom: 10,
        },
        style,
      ]}
    >
      <Dropdown
        style={[
          styles.dropdown,
          { borderColor: borderColor || Colors.dark.secondary },
          { borderRadius: borderRadius || 16 },
          { width: width},
          { height: height || 52 },
          { margin: margin || 0 },
        ]}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={[
          styles.selectedTextStyle,
          { color: color || Colors.dark.icon },
          textStyle,
        ]}
        inputSearchStyle={styles.inputSearchStyle}
        iconStyle={styles.iconStyle}
        iconColor={iconColor || '#fff'}
        data={data}
        search={!!searchbar}
        maxHeight={300}
        labelField="label"
        valueField="value"
        placeholder={
          !isFocus
            ? settedValue !== ''
              ? settedValue
              : i18n.t(`${title}`)
            : '...'
        }
        searchPlaceholder={`${i18n.t('search')}...`}
        value={value}
        onFocus={() => setIsFocus(true)}
        onBlur={() => setIsFocus(false)}
        onChange={(item: DropdownData) => {
          handleCategoryChange(item.value);
          setSettedValue(item.label);
          setIsFocus(false);
        }}
        renderLeftIcon={
          isLeftIcon
            ? () => (
              <Ionicons name="globe-outline" size={24} color={Colors.dark.secondary}/>              )
            : null
        }
        renderRightIcon={
          () => (
            <FontAwesome
              name="chevron-down"
              size={16}
              color={Colors.light.icon}
            />
          )
        }
      />
    </View>
  );
};

export default CustomDropdown;
