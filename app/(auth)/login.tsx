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

export default function LoginScreen() {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Por favor, preencha todos os campos.");
      return;
    }
    console.log("Tentando login com:", email, password);
    const ok = await login(email, password);
    console.log("Login result:", ok);
    if (!ok) setError("Email ou password incorretos.");
    else router.replace("/");
  };

  useEffect(() => {
    if (email && password) setError("");
  }, [email, password]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Ionicons name="home-outline" size={56} color="#2563EB" />
          <Text style={styles.appName}>CasaPronta</Text>
          <Text style={styles.subtitle}>O cofre digital dos seus imóveis</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
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

          {error ? (
            <Text
              style={{ color: "#DC2626", textAlign: "center", marginBottom: 8 }}
            >
              {error}
            </Text>
          ) : null}

          <TouchableOpacity
            style={styles.forgot}
            onPress={() => router.push("/(auth)/request-password")}
          >
            <Text style={styles.forgotText}>Esqueceu-se da password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
            <Text style={styles.primaryButtonText}>Entrar</Text>
          </TouchableOpacity>

          <Text style={styles.securityText}>
            🔒 Dados protegidos com encriptação de nível bancário
          </Text>
        </View>

        {/* Register */}
        <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
          <Text style={styles.registerText}>
            Ainda não tem conta? <Text style={styles.link}>Criar conta</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
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
