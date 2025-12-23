import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { api } from "@/hooks/services/api";

export default function ResetPasswordScreen() {
  const router = useRouter();
  // If you use a link like /reset-password?token=xxx, you can get the token from params
  const { token } = useLocalSearchParams<{ token: string }>();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  console.log({ token });
  const handleReset = async () => {
    console.log({ b: "dasdsad" });
    if (!newPassword || !confirmPassword) {
      setMessage("Por favor, preencha todos os campos.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("As passwords não coincidem.");
      return;
    }
    if (!token) {
      setMessage("Token inválido.");
      return;
    }
    setLoading(true);
    console.log({ token });
    try {
      await api.post("/auth/reset-password", {
        token,
        newPassword,
      });
      Alert.alert("Sucesso", "Password alterada com sucesso!", [
        { text: "OK", onPress: () => router.replace("/(auth)/login") },
      ]);
    } catch (e: any) {
      setMessage(
        e?.response?.data?.message ||
          "Erro ao redefinir a password. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Redefinir Password</Text>
      <TextInput
        placeholder="Nova password"
        secureTextEntry
        style={styles.input}
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <TextInput
        placeholder="Confirmar nova password"
        secureTextEntry
        style={styles.input}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      {message && <Text style={styles.error}>{message}</Text>}
      <TouchableOpacity
        style={styles.button}
        onPress={handleReset}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "A atualizar..." : "Redefinir Password"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
    color: "#0F172A",
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  button: {
    backgroundColor: "#2563EB",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  error: {
    color: "#DC2626",
    textAlign: "center",
    marginBottom: 8,
  },
});
