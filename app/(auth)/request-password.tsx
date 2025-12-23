import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { api } from "@/hooks/services/api";

export default function RequestPasswordResetScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleRequest = async () => {
    if (!email) {
      setMessage("Por favor, insira o seu email.");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.post("/auth/request-password-reset", { email });

      Alert.alert(
        "Verifique o seu email",
        "Se o email existir, irá receber um link para redefinir a password.",
        [{ text: "OK", onPress: () => router.replace("/(auth)/login") }]
      );
    } catch (e: any) {
      setMessage(
        e?.response?.data?.message ||
          "Erro ao enviar email de recuperação. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recuperar Password</Text>
      <TextInput
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />
      {message && <Text style={styles.error}>{message}</Text>}
      <TouchableOpacity
        style={styles.button}
        onPress={handleRequest}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "A enviar..." : "Enviar link de recuperação"}
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
