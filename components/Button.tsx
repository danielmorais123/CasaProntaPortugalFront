// components/ui/Button.tsx
import React, { useMemo, useState } from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";

type ButtonVariant =
  | "default"
  | "secondary"
  | "outline"
  | "destructive"
  | "ghost"
  | "gold";

type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export function Button({
  title,
  onPress,
  variant = "default",
  size = "md",
  loading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const [pressed, setPressed] = useState(false);

  const spinnerColor = useMemo(() => {
    if (variant === "outline" || variant === "ghost") return "#2563EB";
    if (variant === "secondary") return "#0F172A";
    if (variant === "gold") return "#0F172A";
    if (variant === "destructive") return "#FFFFFF";
    return "#FFFFFF";
  }, [variant]);

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        styles.base,
        sizeStyles[size].container,
        variantStyles[variant].container,
        !isDisabled && variant !== "ghost" && styles.shadow,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <Text
          style={[
            styles.text,
            sizeStyles[size].text,
            variantStyles[variant].text,
            pressed &&
              !isDisabled &&
              variant === "ghost" &&
              styles.ghostPressedText,
            isDisabled && variantStyles[variant].textDisabled,
            textStyle,
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const sizeStyles: Record<
  ButtonSize,
  { container: ViewStyle; text: TextStyle }
> = {
  sm: {
    container: { height: 40, paddingHorizontal: 14, borderRadius: 12 },
    text: { fontSize: 13 },
  },
  md: {
    container: { height: 48, paddingHorizontal: 16, borderRadius: 14 },
    text: { fontSize: 14 },
  },
  lg: {
    container: { height: 54, paddingHorizontal: 18, borderRadius: 16 },
    text: { fontSize: 15 },
  },
};

const variantStyles: Record<
  ButtonVariant,
  { container: ViewStyle; text: TextStyle; textDisabled: TextStyle }
> = {
  default: {
    container: {
      backgroundColor: "#2563EB",
      borderWidth: 1,
      borderColor: "#2563EB",
    },
    text: { color: "#FFFFFF" },
    textDisabled: { color: "#E2E8F0" },
  },
  secondary: {
    container: {
      backgroundColor: "#F1F5F9",
      borderWidth: 1,
      borderColor: "#E2E8F0",
    },
    text: { color: "#0F172A" },
    textDisabled: { color: "#94A3B8" },
  },
  outline: {
    container: {
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#CBD5E1",
    },
    text: { color: "#2563EB" },
    textDisabled: { color: "#94A3B8" },
  },
  destructive: {
    container: {
      backgroundColor: "#DC2626",
      borderWidth: 1,
      borderColor: "#DC2626",
    },
    text: { color: "#FFFFFF" },
    textDisabled: { color: "#FEE2E2" },
  },
  ghost: {
    container: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: "transparent",
    },
    text: { color: "#2563EB" },
    textDisabled: { color: "#94A3B8" },
  },

  // ⭐ NEW: Gold button for "Ver Planos"
  gold: {
    container: {
      backgroundColor: "#F59E0B", // amber-500
      borderWidth: 1,
      borderColor: "#D97706", // amber-600
    },
    text: { color: "#0F172A" }, // dark text reads better on gold
    textDisabled: { color: "#334155" },
  },
};

const styles = StyleSheet.create({
  base: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  text: {
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  shadow: {
    shadowColor: "#0B1220",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  pressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.55,
  },
  ghostPressedText: {
    opacity: 0.8,
  },
});
