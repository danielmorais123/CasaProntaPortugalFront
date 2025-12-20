// components/ui/DateInput.tsx
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";

type DateInputProps = {
  label?: string;
  value?: Date | null;
  placeholder?: string;
  onChange: (date: Date) => void;
  isRequired?: boolean;
  minDate?: Date;
};

export function DateInput({
  label,
  value,
  placeholder = "Selecionar data",
  onChange,
  isRequired = false,
  minDate = new Date(),
}: DateInputProps) {
  const [show, setShow] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const validation = useMemo(() => {
    if (!value) {
      if (isRequired) {
        return { status: "error", message: "Campo obrigatório" };
      }
      return { status: "default" };
    }

    if (minDate && value < minDate) {
      return {
        status: "error",
        message: "A data não pode ser no passado",
      };
    }

    return { status: "valid" };
  }, [value, isRequired, minDate]);

  const formattedDate = value ? value.toLocaleDateString("pt-PT") : placeholder;

  const handleChange = (_: any, selectedDate?: Date) => {
    if (Platform.OS !== "ios") setShow(false);
    if (selectedDate) onChange(selectedDate);
  };

  const borderColor = validation.status === "error" ? "#EF4444" : "#E2E8F0";

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text style={styles.label}>
          {label}
          {isRequired && <Text style={{ color: "#EF4444" }}> *</Text>}
        </Text>
      )}

      <TouchableOpacity
        style={[styles.input, { borderColor }]}
        onPress={() => setShow(true)}
        activeOpacity={0.8}
      >
        <Text style={[styles.text, !value && { color: "#94A3B8" }]}>
          {formattedDate}
        </Text>

        <Ionicons name="calendar-outline" size={18} color="#64748B" />
      </TouchableOpacity>

      {/* Mensagem de erro (shadcn style) */}
      {validation.status === "error" && validation.message && (
        <Text style={styles.errorText}>{validation.message}</Text>
      )}

      {/* ANDROID */}
      {show && Platform.OS === "android" && (
        <DateTimePicker
          value={value || today}
          mode="date"
          display="default"
          minimumDate={minDate}
          onChange={handleChange}
        />
      )}

      {/* iOS */}
      {show && Platform.OS === "ios" && (
        <Modal transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <DateTimePicker
                value={value || today}
                mode="date"
                display="spinner"
                minimumDate={minDate}
                onChange={handleChange}
              />

              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => setShow(false)}
              >
                <Text style={styles.doneText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  text: {
    fontSize: 14,
    color: "#0F172A",
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
  },
  doneButton: {
    marginTop: 10,
    backgroundColor: "#2563EB",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  doneText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
