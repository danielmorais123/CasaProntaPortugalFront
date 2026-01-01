import React, { useContext, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  Pressable,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { AuthContext } from "../../context/AuthContext";
import { useError } from "@/context/ErrorContext";
import { Button } from "@/components/Button";
import { useMutation } from "@tanstack/react-query";

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

export default function LoginScreen() {
  const { login } = useContext(AuthContext);
  const { setError } = useError();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!email || !password) {
        throw new Error("Por favor, preencha todos os campos.");
      }
      console.log("EMAIL DASNDASJND");
      const ok = await login(email, password);
      if (!ok) throw new Error("Email ou password incorretos.");
      return ok;
    },
    onSuccess: () => {
      router.replace("/");
    },
    onError: (err: any) => {
      setError(err?.message || "Ocorreu um erro inesperado.");
    },
  });

  const canSubmit = useMemo(
    () => !!email && !!password && !mutation.isPending,
    [email, password, mutation.isPending]
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.screen}>
        <TouchableOpacity onPress={() => router.push("/")}>
          <Text>Home</Text>
        </TouchableOpacity>
        {/* Top brand */}
        <View style={styles.brand}>
          <View style={styles.brandIcon}>
            <Ionicons name="home-outline" size={28} color="#1D4ED8" />
          </View>
          <Text style={styles.brandName}>CasaPronta</Text>
          <Text style={styles.brandSub}>O cofre digital dos seus imóveis</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Entrar</Text>
          <Text style={styles.cardSub}>Aceda à sua conta em segundos.</Text>

          <View style={{ height: 14 }} />

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

          <View style={{ height: 12 }} />

          <Pressable
            style={styles.forgot}
            onPress={() => router.push("/(auth)/request-password")}
          >
            <Text style={styles.forgotText}>Esqueceu-se da password?</Text>
          </Pressable>

          <View style={{ height: 10 }} />

          <Button
            title={mutation.isPending ? "A entrar…" : "Entrar"}
            onPress={() => mutation.mutate()}
            loading={mutation.isPending}
            disabled={!canSubmit}
          />

          <View style={styles.secRow}>
            <Ionicons
              name="shield-checkmark-outline"
              size={16}
              color="#64748B"
            />
            <Text style={styles.securityText}>
              Dados protegidos com encriptação de nível bancário
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => router.push("/(auth)/register")}
          style={styles.bottomLink}
        >
          <Text style={styles.bottomText}>
            Ainda não tem conta?{" "}
            <Text style={styles.linkStrong}>Criar conta</Text>
          </Text>
        </Pressable>

        {/* small loading overlay (optional) */}
        {mutation.isPending ? (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator />
          </View>
        ) : null}
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

  brand: {
    alignItems: "center",
    marginBottom: 18,
  },
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
  brandName: {
    fontSize: 26,
    fontWeight: "900",
    color: "#0F172A",
  },
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
  cardTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
  },
  cardSub: {
    marginTop: 6,
    fontSize: 12,
    color: "#64748B",
    lineHeight: 16,
  },

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
  input: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "600",
  },

  forgot: {
    alignSelf: "flex-end",
  },
  forgotText: {
    color: "#2563EB",
    fontSize: 13,
    fontWeight: "800",
  },

  secRow: {
    marginTop: 14,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  securityText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },

  bottomLink: {
    marginTop: 16,
    alignItems: "center",
  },
  bottomText: {
    fontSize: 14,
    color: "#475569",
  },
  linkStrong: {
    color: "#2563EB",
    fontWeight: "900",
  },

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

  loadingOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: "center",
    opacity: 0.5,
  },
});
