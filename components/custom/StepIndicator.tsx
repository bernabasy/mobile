import { Colors } from '@/constants/Colors';
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

interface Step {
  title: string;
}

interface StepperProps {
  steps: Step[];
  activeStep: number;
}


const AnimatedStepper: React.FC<StepperProps> = ({ steps, activeStep }) => {

  const animatedStyles = steps.map((_, index) => {
    return useAnimatedStyle(() => {
      const isActive = index <= activeStep;
      const opacity = isActive ? 1 : 0.3;  // Dim inactive steps
      const scale = isActive ? 1 : 0.8; // Slightly shrink inactive steps
      return {
        opacity,
        transform: [{ scale: withTiming(scale, { duration: 300, easing: Easing.out(Easing.ease) }) }],
      };
    });
  });



  return (
    <View style={styles.stepperContainer}>
      {steps.map((step, index) => (
        <Animated.View key={index} style={[styles.stepContainer, animatedStyles[index]]}>
          <View style={[styles.step,  index <= activeStep ? styles.activeStep : styles.inactiveStep]}>
            <Text style={ index <= activeStep ? styles.activeStepText : styles.inactiveStepText}>{index + 1}</Text>
          </View>
           <Text style={[styles.stepTitle, index <= activeStep ? styles.activeStepTitle : styles.inactiveStepTitle]}>{step.title}</Text>

        </Animated.View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Distribute steps evenly
    alignItems: 'center',       // Vertically center steps and titles
    marginBottom: 20,
    paddingHorizontal: 10,

  },
  stepContainer:{
        alignItems: 'center',  // Center the step number and title vertically

  },

  step: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',

  },
  stepTitle: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',    // Center the title text
  },
  activeStep: {
    backgroundColor: Colors.dark.secondary, // Or your active color
  },
  inactiveStep: {
    backgroundColor: '#ccc',    // Or your inactive color
  },
  activeStepText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16

  },
  inactiveStepText: {
    color: '#666',   // Or your inactive step text color
    fontSize: 16

  },
    activeStepTitle: {
    color: Colors.dark.secondary, // Or your active title color
    fontWeight: 'bold',

  },
  inactiveStepTitle: {
      color: '#999'
  }
});

export default AnimatedStepper;

