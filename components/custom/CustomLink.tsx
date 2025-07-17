import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import CustomText from './CustomText';
import { Colors } from '@/constants/Colors';

const styles = StyleSheet.create({
  link: {
    fontSize: 10,
    fontWeight: '500',
    alignSelf: 'center',
    color:  Colors.dark.primary,
    fontFamily: 'Poppins',
    textDecorationLine: 'underline',
  },
})
type CustomLinkProps = {
  handleLinkPress: () => void | null;
  title?: string;
};


const CustomLink: React.FC<CustomLinkProps>
 = ({ handleLinkPress, title }) => (
  <View>
    <TouchableOpacity onPress={handleLinkPress || null}>
      <CustomText style={styles.link}>{title}</CustomText>
    </TouchableOpacity>
  </View>
)

export default CustomLink