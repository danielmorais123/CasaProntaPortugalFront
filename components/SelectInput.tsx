import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Option = {
  label: string;
  value: string;
};

type SelectInputProps = {
  label?: string;
  placeholder?: string;
  options: Option[];
  value?: string;
  onChange: (value: string) => void;
};

export function SelectInput({
  label,
  placeholder = "Selecionar",
  options,
  value,
  onChange,
}: SelectInputProps) {
  const [open, setOpen] = useState(false);

  const selectedLabel =
    options.find((o) => o.value === value)?.label ?? placeholder;

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={styles.input}
        onPress={() => setOpen(!open)}
        activeOpacity={0.8}
      >
        <Text style={[styles.text, !value && { color: "#94A3B8" }]}>
          {selectedLabel}
        </Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color="#64748B"
        />
      </TouchableOpacity>

      {open && (
        <View style={styles.dropdown}>
          <FlatList
            data={options}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.option}
                onPress={() => {
                  onChange(item.value);
                  setOpen(false);
                }}
              >
                <Text style={styles.optionText}>{item.label}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  text: {
    fontSize: 14,
    color: "#0F172A",
  },
  dropdown: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 6,
    overflow: "hidden",
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  optionText: {
    fontSize: 14,
  },
});
