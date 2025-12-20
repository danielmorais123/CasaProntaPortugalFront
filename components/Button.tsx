// components/ui/Button.tsx
import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from "react-native";

type ButtonVariant =
  | "default"
  | "secondary"
  | "outline"
  | "destructive"
  | "ghost";

type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

const variantStyles = {
  default: {
    container: {
      backgroundColor: "#2563EB",
      borderWidth: 0,
    },
    text: { color: "#FFFFFF" },
  },
  secondary: {
    container: {
      backgroundColor: "#E5E7EB",
    },
    text: { color: "#111827" },
  },
  outline: {
    container: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: "#E5E7EB",
    },
    text: { color: "#111827" },
  },
  destructive: {
    container: {
      backgroundColor: "#EF4444",
    },
    text: { color: "#FFFFFF" },
  },
  ghost: {
    container: {
      backgroundColor: "transparent",
    },
    text: { color: "#2563EB" },
  },
};

const sizeStyles = {
  sm: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    fontSize: 13,
  },
  md: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    fontSize: 14,
  },
  lg: {
    paddingVertical: 16,
    paddingHorizontal: 22,
    fontSize: 16,
  },
};

export function Button({
  title,
  onPress,
  variant = "default",
  size = "md",
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        variantStyles[variant].container,
        sizeStyles[size],
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === "outline" || variant === "ghost" ? "#2563EB" : "#FFF"
          }
        />
      ) : (
        <Text
          style={[
            styles.text,
            variantStyles[variant].text,
            { fontSize: sizeStyles[size].fontSize },
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  text: {
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.5,
  },
});
