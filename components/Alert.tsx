// components/ui/Alert.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type AlertVariant = "default" | "info" | "success" | "warning" | "destructive";

type AlertProps = {
  title?: string;
  description?: string;
  variant?: AlertVariant;
};

const variantConfig = {
  default: {
    bg: "#F8FAFC",
    border: "#E2E8F0",
    text: "#0F172A",
    icon: "information-circle-outline",
    iconColor: "#475569",
  },
  info: {
    bg: "#EFF6FF",
    border: "#BFDBFE",
    text: "#1E40AF",
    icon: "information-circle-outline",
    iconColor: "#2563EB",
  },
  success: {
    bg: "#ECFDF5",
    border: "#A7F3D0",
    text: "#065F46",
    icon: "checkmark-circle-outline",
    iconColor: "#10B981",
  },
  warning: {
    bg: "#FFFBEB",
    border: "#FDE68A",
    text: "#92400E",
    icon: "alert-circle-outline",
    iconColor: "#F59E0B",
  },
  destructive: {
    bg: "#FEF2F2",
    border: "#FECACA",
    text: "#991B1B",
    icon: "close-circle-outline",
    iconColor: "#EF4444",
  },
};

export function Alert({ title, description, variant = "default" }: AlertProps) {
  const config = variantConfig[variant];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
        },
      ]}
    >
      <Ionicons
        name={config.icon as any}
        size={20}
        color={config.iconColor}
        style={styles.icon}
      />

      <View style={styles.content}>
        {title && (
          <Text style={[styles.title, { color: config.text }]}>{title}</Text>
        )}
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  icon: {
    marginRight: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
  },
});
