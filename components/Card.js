import React from "react";
import { StyleSheet, View } from "react-native";
import { borderRadius, colors, shadows, spacing } from "../styles/theme";

const Card = ({ children, style, ...props }) => {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginVertical: spacing.sm,
    marginHorizontal: spacing.md,
    ...shadows.md,
  },
});

export default Card; 