import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  Pressable,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { api } from "@/hooks/services/api";
import { Button } from "@/components/Button";

function ErrorCard({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <View style={styles.errorBox}>
      <View style={styles.errorIcon}>
        <Ionicons name="alert-circle" size={18} color="#B91C1C" />
      </View>
      <Text style={styles.errorText}>{message}</Text>
      <Pressable onPress={onClose} style={styles.errorClose}>
        <Ionicons name="close" size={18} color="#64748B" />
      </Pressable>
    </View>
  );
}

function InputRow({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
}: {
  icon: any;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  secureTextEntry?: boolean;
}) {
  return (
    <View style={styles.inputWrap}>
      <View style={styles.inputIcon}>
        <Ionicons name={icon} size={18} color="#2563EB" />
      </View>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
      />
    </View>
  );
}

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const canSubmit = useMemo(() => {
    return !!newPassword && !!confirmPassword && !loading;
  }, [newPassword, confirmPassword, loading]);

  const handleReset = async () => {
    if (!newPassword || !confirmPassword) {
      setError("Por favor, preencha todos os campos.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("As passwords não coincidem.");
      return;
    }
    if (!token) {
      setError("Token inválido.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await api.post("/auth/reset-password", { token, newPassword });

      Alert.alert("Sucesso", "Password alterada com sucesso!", [
        { text: "OK", onPress: () => router.replace("/(auth)/login") },
      ]);
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          "Erro ao redefinir a password. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.screen}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={18} color="#0F172A" />
          <Text style={styles.backText}>Voltar</Text>
        </Pressable>

        <View style={styles.brand}>
          <View style={styles.brandIcon}>
            <Ionicons name="lock-open-outline" size={28} color="#1D4ED8" />
          </View>
          <Text style={styles.brandName}>Redefinir Password</Text>
          <Text style={styles.brandSub}>Crie uma password nova e segura.</Text>
        </View>

        {!!error && <ErrorCard message={error} onClose={() => setError("")} />}

        <View style={styles.card}>
          <Text style={styles.label}>Nova password</Text>
          <InputRow
            icon="lock-closed-outline"
            placeholder="Nova password"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />

          <View style={{ height: 12 }} />

          <Text style={styles.label}>Confirmar</Text>
          <InputRow
            icon="repeat-outline"
            placeholder="Confirmar nova password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <View style={{ height: 14 }} />

          <Button
            title={loading ? "A atualizar…" : "Redefinir Password"}
            onPress={handleReset}
            loading={loading}
            disabled={!canSubmit}
          />

          <View style={{ height: 10 }} />
          <Button
            variant="ghost"
            title="Voltar ao login"
            onPress={() => router.replace("/(auth)/login")}
          />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 20,
    paddingTop: 18,
  },

  backBtn: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  backText: { fontWeight: "800", color: "#0F172A", fontSize: 12 },

  brand: { alignItems: "center", marginTop: 14, marginBottom: 14 },
  brandIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#DBEAFE",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  brandName: { fontSize: 20, fontWeight: "900", color: "#0F172A" },
  brandSub: {
    marginTop: 6,
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },

  label: { fontSize: 12, fontWeight: "900", color: "#475569", marginBottom: 8 },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  inputIcon: {
    width: 30,
    height: 30,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
  },
  input: { flex: 1, fontSize: 14, color: "#0F172A", fontWeight: "600" },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  errorIcon: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
  },
  errorText: {
    flex: 1,
    color: "#991B1B",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  errorClose: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
});
