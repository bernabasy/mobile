import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import CustomText from './CustomText';
import { Colors } from '@/constants/Colors';

const width = Dimensions.get('window').width;

type Props = {
  title: string;
  subtitle: string;
  translate: boolean;
  image?: string;
  onPress: () => void;
  active?: boolean;
};

const DEFAULT_IMAGE = require('@/assets/images/dars.png'); // Use require for local images

const ListCard: React.FC<Props> = ({
  title,
  translate,
  subtitle,
  image = DEFAULT_IMAGE,
  onPress,
  active = true,
}) => {
  console.log(image)
  return (
    <TouchableOpacity
      style={[styles.card, { opacity: active? 1: 0.5 }]}
      onPress={active? onPress: undefined}
      disabled={!active}
    >
      <View style={styles.cardContent}>
        <Image source={{uri: `${process.env.EXPO_PUBLIC_API_URL}/v1/images/${image}`}} style={styles.image} />
        <View style={styles.textContainer}>
          <CustomText translate={translate || false} variant="h3" numberOfLines={1}>
            {title}
          </CustomText>
          {subtitle && (
            <CustomText translate={translate || false} variant="xs" numberOfLines={1}>
              {subtitle}
            </CustomText>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: width * 0.9, // Occupy more width for a list
    height: 70, // Adjust height as needed
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 8,
    borderColor: Colors.dark.gray,
    borderWidth: 1,
    justifyContent: 'center', // Center content vertically
  },
  cardContent: {
    flexDirection: 'row', // Arrange image and text horizontally
    alignItems: 'center', // Align items vertically
    paddingHorizontal: 10, // Add horizontal padding
  },
  image: {
    width: 50, // Fixed width for image
    height: 50, // Fixed height for image
    borderRadius: 8, // Make image circular,
    backgroundColor: Colors.dark.gray,
    marginRight: 10,  // Space between image and text
    resizeMode: "contain",
  },
  textContainer: {
    flex: 1, // Allow text container to expand
  },
});

export default ListCard;