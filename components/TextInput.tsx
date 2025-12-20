import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";

type TextFieldProps = {
  label?: string;
  value: string;
  placeholder?: string;
  onChangeText: (text: string) => void;
  error?: string;
};

export function TextField({
  label,
  value,
  placeholder,
  onChangeText,
  error,
}: TextFieldProps) {
  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TextInput
        value={value}
        placeholder={placeholder}
        onChangeText={onChangeText}
        style={[styles.input, error && styles.inputError]}
      />

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}
const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#475569",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 14,
    color: "#0F172A",
  },
  inputError: {
    borderColor: "#EF4444",
  },
  error: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 4,
  },
});
