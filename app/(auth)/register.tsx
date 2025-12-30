import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { AuthContext } from "../../context/AuthContext";
import { Button } from "@/components/Button";
import { useMutation } from "@tanstack/react-query";

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
  keyboardType,
  secureTextEntry,
  autoCapitalize,
}: {
  icon: any;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: any;
  secureTextEntry?: boolean;
  autoCapitalize?: any;
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
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

export default function RegisterScreen() {
  const { register } = useContext(AuthContext);
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!fullName || !email || !password || !confirmPassword) {
        throw new Error("Por favor, preencha todos os campos.");
      }
      if (password !== confirmPassword) {
        throw new Error("As passwords não coincidem.");
      }
      const ok = await register(fullName, email, password, confirmPassword);
      if (!ok) throw new Error("Algum erro ocorreu. Tente mais tarde.");
      return ok;
    },
    onSuccess: () => {
      router.replace("/(auth)/login");
    },
    onError: (e: any) => {
      setLocalError(
        e?.response?.data?.message ||
          e?.message ||
          "Algum erro ocorreu. Tente mais tarde."
      );
    },
  });

  const canSubmit = useMemo(() => {
    return (
      !!fullName &&
      !!email &&
      !!password &&
      !!confirmPassword &&
      !mutation.isPending
    );
  }, [fullName, email, password, confirmPassword, mutation]);

  useEffect(() => {
    if (localError && fullName && email && password && confirmPassword)
      setLocalError("");
  }, [fullName, email, password, confirmPassword, localError]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.screen}>
        <View style={styles.brand}>
          <View style={styles.brandIcon}>
            <Ionicons
              name="shield-checkmark-outline"
              size={28}
              color="#1D4ED8"
            />
          </View>
          <Text style={styles.brandName}>Criar Conta</Text>
          <Text style={styles.brandSub}>A sua casa organizada e segura</Text>
        </View>

        {!!localError && (
          <ErrorCard message={localError} onClose={() => setLocalError("")} />
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Começar</Text>
          <Text style={styles.cardSub}>
            Crie uma conta para organizar os seus imóveis.
          </Text>

          <View style={{ height: 14 }} />

          <InputRow
            icon="person-outline"
            placeholder="Nome completo"
            value={fullName}
            onChangeText={setFullName}
          />
          <View style={{ height: 10 }} />
          <InputRow
            icon="mail-outline"
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <View style={{ height: 10 }} />
          <InputRow
            icon="lock-closed-outline"
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <View style={{ height: 10 }} />
          <InputRow
            icon="repeat-outline"
            placeholder="Confirmar password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <View style={{ height: 12 }} />

          <Button
            title={mutation.isPending ? "A criar…" : "Criar Conta"}
            onPress={() => mutation.mutate()}
            loading={mutation.isPending}
            disabled={!canSubmit}
          />

          <View style={styles.legalRow}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color="#64748B"
            />
            <Text style={styles.legalText}>
              Ao criar conta, aceita os Termos e Política de Privacidade.
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => router.replace("/(auth)/login")}
          style={styles.bottomLink}
        >
          <Text style={styles.bottomText}>
            Já tem conta? <Text style={styles.linkStrong}>Entrar</Text>
          </Text>
        </Pressable>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 20,
    justifyContent: "center",
  },

  brand: { alignItems: "center", marginBottom: 18 },
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
  brandName: { fontSize: 24, fontWeight: "900", color: "#0F172A" },
  brandSub: {
    marginTop: 6,
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
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
  cardTitle: { fontSize: 18, fontWeight: "900", color: "#0F172A" },
  cardSub: { marginTop: 6, fontSize: 12, color: "#64748B", lineHeight: 16 },

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

  legalRow: {
    marginTop: 14,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  legalText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
    textAlign: "center",
  },

  bottomLink: { marginTop: 16, alignItems: "center" },
  bottomText: { fontSize: 14, color: "#475569" },
  linkStrong: { color: "#2563EB", fontWeight: "900" },

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
  errorText: { flex: 1, color: "#991B1B", fontSize: 13, fontWeight: "700" },
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
