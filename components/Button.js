import React from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
} from "react-native";
import { borderRadius, colors, spacing } from "../styles/theme";

const Button = ({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  style,
  textStyle,
  ...props
}) => {
  const getButtonStyle = () => {
    const baseStyle = [styles.button];

    switch (variant) {
      case "secondary":
        baseStyle.push(styles.secondaryButton);
        break;
      case "outline":
        baseStyle.push(styles.outlineButton);
        break;
      case "danger":
        baseStyle.push(styles.dangerButton);
        break;
      case "success":
        baseStyle.push(styles.successButton);
        break;
      default:
        baseStyle.push(styles.primaryButton);
    }

    switch (size) {
      case "small":
        baseStyle.push(styles.smallButton);
        break;
      case "large":
        baseStyle.push(styles.largeButton);
        break;
      default:
        baseStyle.push(styles.mediumButton);
    }

    if (disabled || loading) {
      baseStyle.push(styles.disabledButton);
    }

    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.buttonText];

    switch (variant) {
      case "outline":
        baseStyle.push(styles.outlineButtonText);
        break;
      default:
        baseStyle.push(styles.primaryButtonText);
    }

    switch (size) {
      case "small":
        baseStyle.push(styles.smallButtonText);
        break;
      case "large":
        baseStyle.push(styles.largeButtonText);
        break;
      default:
        baseStyle.push(styles.mediumButtonText);
    }

    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={[...getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "outline" ? colors.primary : colors.white}
        />
      ) : (
        <Text style={[...getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadius.md,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.gray[600],
  },
  outlineButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.primary,
  },
  dangerButton: {
    backgroundColor: colors.error,
  },
  successButton: {
    backgroundColor: colors.success,
  },
  disabledButton: {
    opacity: 0.6,
  },
  smallButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  mediumButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  largeButton: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  buttonText: {
    fontWeight: "600",
  },
  primaryButtonText: {
    color: colors.white,
  },
  outlineButtonText: {
    color: colors.primary,
  },
  smallButtonText: {
    fontSize: 14,
  },
  mediumButtonText: {
    fontSize: 16,
  },
  largeButtonText: {
    fontSize: 18,
  },
});

export default Button; 