import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";

export type Item = {
  id: string;
  label: string;
};

type AutocompleteInputProps = {
  label?: string;
  placeholder?: string;
  searchFn: (query: string) => Promise<Item[]>;
  onSelect: (item: Item) => void;
  disabled?: boolean;
  iconName?: keyof typeof Ionicons.glyphMap;
};

export function AutocompleteInput({
  label,
  placeholder,
  searchFn,
  onSelect,
  disabled = false,
  iconName = "person-outline",
}: AutocompleteInputProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const { results, loading } = useDebouncedSearch<Item>(query, searchFn);

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={styles.inputWrapper}>
        <TextInput
          value={query}
          placeholder={placeholder}
          editable={!disabled}
          onChangeText={(text) => {
            setQuery(text);
            setOpen(true);
          }}
          style={styles.input}
        />

        {loading ? (
          <ActivityIndicator size="small" />
        ) : (
          <Ionicons name="search-outline" size={18} color="#64748B" />
        )}
      </View>

      {open && results.length > 0 && (
        <View style={styles.dropdown}>
          <FlatList
            keyboardShouldPersistTaps="handled"
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.option}
                onPress={() => {
                  setQuery(item.label);
                  setOpen(false);
                  onSelect(item);
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons
                    name={iconName}
                    size={18}
                    color="#64748B"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.optionText}>{item.label}</Text>
                </View>
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
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 14,
  },
  dropdown: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 6,
    maxHeight: 180,
    overflow: "hidden",
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  optionText: {
    fontSize: 14,
    color: "#0F172A",
  },
});
