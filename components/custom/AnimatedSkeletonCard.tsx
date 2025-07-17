import { Colors } from '@/constants/Colors';
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const ScreenWidth = Dimensions.get('window').width;

interface AnimatedSkeletonCardProps {
  width?: number;
  height?: number;
  borderRadius?: number;
  backgroundColor?: string;
  animationDuration?: number;
}

const AnimatedSkeletonCard: React.FC<AnimatedSkeletonCardProps> = ({
  width = ScreenWidth * 0.9, // Match ListCard width
  height = 70, // Match ListCard height
  borderRadius = 8, // Match ListCard borderRadius
  backgroundColor = Colors.dark.text,
  animationDuration = 1000,
}) => {
  const translateX = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  translateX.value = withRepeat(
    withTiming(-width, { duration: animationDuration, easing: Easing.linear }),
    -1,
    false
  );

  return (
    <View
      style={[
        styles.card, // Apply ListCard styles
        { width, height, borderRadius, overflow: 'hidden' },
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <LinearGradient
          colors={[Colors.dark.text, Colors.light.lightGray, Colors.dark.text]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { // Copied styles from ListCard
    width: ScreenWidth * 0.9,
    height: 70,
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 8,
    borderColor: Colors.dark.gray,
    borderWidth: 1,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  image: { // Placeholder for image area
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
    backgroundColor: Colors.dark.text, // Background color for image placeholder
  },
  textContainer: {
    flex: 1,
    backgroundColor: Colors.dark.text, // Background color for text placeholder
    height: 30, // Adjust text container height
    borderRadius: 5,
  },
});

export default AnimatedSkeletonCard;