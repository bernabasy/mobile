import { StyleSheet } from "react-native";

export const colors = {
  primary: "#16a34a",
  secondary: "#065f46",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
  light: "#f8f9fa",
  dark: "#1f2937",
  white: "#ffffff",
  gray: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
  },
  green: {
    50: "#f0fdf4",
    100: "#dcfce7",
    500: "#22c55e",
    600: "#16a34a",
    700: "#15803d",
    800: "#166534",
  },
  blue: {
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
  },
  orange: {
    500: "#f97316",
    600: "#ea580c",
    700: "#c2410c",
  },
  red: {
    500: "#ef4444",
    600: "#dc2626",
  },
  purple: {
    500: "#8b5cf6",
    600: "#7c3aed",
    700: "#5b21b6",
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
  },
};

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginVertical: spacing.sm,
    marginHorizontal: spacing.md,
    ...shadows.md,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    backgroundColor: colors.white,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.gray[700],
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.dark,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.gray[800],
    marginBottom: spacing.sm,
  },
  text: {
    fontSize: 16,
    color: colors.gray[700],
    lineHeight: 24,
  },
  textCenter: {
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  spaceBetween: {
    justifyContent: "space-between",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  flex1: {
    flex: 1,
  },
  marginBottom: {
    marginBottom: spacing.md,
  },
  marginTop: {
    marginTop: spacing.md,
  },
  padding: {
    padding: spacing.md,
  },
  paddingHorizontal: {
    paddingHorizontal: spacing.md,
  },
  paddingVertical: {
    paddingVertical: spacing.md,
  },
  touchableButton: {
    minWidth: 48,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.md,
  },
  headerButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  iconButton: {
    minWidth: 40,
    minHeight: 40,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  backButton: {
    minWidth: 48,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  refreshButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
});

export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "Birr 0";
  }
  return `Birr ${Number(amount).toLocaleString()}`;
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-ET", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "paid":
    case "completed":
    case "delivered":
      return colors.success;
    case "pending":
    case "processing":
      return colors.warning;
    case "cancelled":
    case "failed":
      return colors.error;
    case "draft":
      return colors.gray[500];
    default:
      return colors.gray[500];
  }
}; 