import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { AuthContext } from "../../context/AuthContext";

export default function RegisterScreen() {
  const { register } = useContext(AuthContext);
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      setError("Por favor, preencha todos os campos.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As passwords não coincidem.");
      return;
    }

    try {
      await register(fullName, email, password, confirmPassword);
      router.push("/(auth)/login");
    } catch (e: any) {
      setError(
        e?.response?.data?.message || "Algum erro ocorreu tente mais tarde."
      );
    }
  };

  useEffect(() => {
    if (fullName && email && password && confirmPassword) setError("");
  }, [fullName, email, password, confirmPassword]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.logoContainer}>
          <Ionicons name="shield-checkmark-outline" size={52} color="#2563EB" />
          <Text style={styles.appName}>Criar Conta</Text>
          <Text style={styles.subtitle}>A sua casa organizada e segura</Text>
        </View>
        {error ? (
          <View style={styles.errorBox}>
            <View style={styles.errorIcon}>
              <Ionicons name="alert-circle" size={18} color="#B91C1C" />
            </View>

            <Text style={styles.errorText}>{error}</Text>

            <TouchableOpacity
              onPress={() => setError("")}
              style={styles.errorClose}
            >
              <Ionicons name="close" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>
        ) : null}
        {/* Card */}
        <View style={styles.card}>
          <TextInput
            placeholder="Nome completo"
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
          />

          <TextInput
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            placeholder="Password"
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />

          <TextInput
            placeholder="Confirmar password"
            secureTextEntry
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleRegister}
          >
            <Text style={styles.primaryButtonText}>Criar Conta</Text>
          </TouchableOpacity>

          <Text style={styles.securityText}>
            Ao criar conta aceita os Termos e Política de Privacidade
          </Text>
        </View>

        {/* Back to Login */}
        <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
          <Text style={styles.registerText}>
            Já tem conta? <Text style={styles.link}>Entrar</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FEF2F2", // red-50
    borderWidth: 1,
    borderColor: "#FECACA", // red-200
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 12,
  },
  errorIcon: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2", // red-100
  },
  errorText: {
    flex: 1,
    color: "#991B1B", // red-800
    fontSize: 13,
    fontWeight: "600",
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

  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  logoContainer: {
    alignItems: "center",
    marginBottom: 32,
  },

  appName: {
    fontSize: 26,
    fontWeight: "700",
    marginTop: 12,
    color: "#0F172A",
  },

  subtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
    textAlign: "center",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 20,
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

  forgot: {
    alignItems: "flex-end",
    marginBottom: 18,
  },

  forgotText: {
    color: "#2563EB",
    fontSize: 13,
  },

  primaryButton: {
    backgroundColor: "#2563EB",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  securityText: {
    textAlign: "center",
    fontSize: 12,
    color: "#64748B",
    marginTop: 16,
  },

  registerText: {
    textAlign: "center",
    fontSize: 14,
    color: "#475569",
  },

  link: {
    color: "#2563EB",
    fontWeight: "700",
  },
});
