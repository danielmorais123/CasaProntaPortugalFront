import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { confirmDevice } from "@/hooks/services/device";
import { useRouter } from "expo-router";

export default function ConfirmDeviceScreen() {
  const router = useRouter();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pushToken = "DEVICE_PUSH_TOKEN"; // ← vem do teu contexto / storage

  const isValid = code.length === 6;

  async function onConfirm() {
    if (!isValid) return;

    setLoading(true);
    setError(null);

    try {
      const ok = await confirmDevice(pushToken, code);

      if (!ok) {
        setError("Código inválido ou expirado.");
        return;
      }

      router.replace("/"); // home
    } catch {
      setError("Não foi possível confirmar o dispositivo.");
    } finally {
      setLoading(false);
    }
  }
  function goToLogin() {
    router.replace("/login");
  }

  function goToRegister() {
    router.replace("/register");
  }
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          {/* Icon */}
          <View style={styles.iconWrap}>
            <Ionicons
              name="shield-checkmark-outline"
              size={28}
              color="#2563EB"
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>Confirmar dispositivo</Text>
          <Text style={styles.subtitle}>
            Enviámos um código de 6 dígitos para o teu email. Confirma para
            continuares em segurança.
          </Text>

          {/* Code input */}
          <View style={styles.inputWrap}>
            <TextInput
              value={code}
              onChangeText={(t) =>
                setCode(t.replace(/[^0-9]/g, "").slice(0, 6))
              }
              keyboardType="number-pad"
              placeholder="••••••"
              placeholderTextColor="#CBD5E1"
              style={styles.codeInput}
              maxLength={6}
              textAlign="center"
            />
          </View>

          {/* Error */}
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#B91C1C" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Confirm */}
          <Pressable
            onPress={onConfirm}
            disabled={!isValid || loading}
            style={[
              styles.primaryBtn,
              (!isValid || loading) && styles.primaryBtnDisabled,
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryBtnText}>Confirmar dispositivo</Text>
            )}
          </Pressable>

          {/* Resend */}
          <Pressable onPress={() => {}} style={styles.resendBtn}>
            <Text style={styles.resendText}>Reenviar código</Text>
          </Pressable>
          {/* Secondary navigation */}
          <View style={styles.altActions}>
            <Pressable onPress={goToLogin} style={styles.altBtn}>
              <Ionicons name="log-in-outline" size={16} color="#2563EB" />
              <Text style={styles.altBtnText}>Ir para login</Text>
            </Pressable>

            <View style={styles.altDivider} />

            <Pressable onPress={goToRegister} style={styles.altBtn}>
              <Ionicons name="person-add-outline" size={16} color="#2563EB" />
              <Text style={styles.altBtnText}>Criar conta</Text>
            </Pressable>
          </View>
          {/* Footer */}
          <View style={styles.footer}>
            <Ionicons name="lock-closed-outline" size={14} color="#64748B" />
            <Text style={styles.footerText}>
              Isto ajuda-nos a proteger a tua conta.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },

  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 16,
  },

  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
    lineHeight: 20,
  },

  inputWrap: {
    marginTop: 28,
    alignItems: "center",
  },
  codeInput: {
    width: 180,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 8,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    color: "#0F172A",
  },

  errorBox: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#991B1B",
  },

  primaryBtn: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "#2563EB",
    alignItems: "center",
  },
  primaryBtnDisabled: {
    backgroundColor: "#BFDBFE",
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 14,
  },

  resendBtn: {
    marginTop: 14,
    alignItems: "center",
  },
  resendText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#2563EB",
  },
  altActions: {
    marginTop: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },

  altBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
  },

  altBtnText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#2563EB",
  },

  altDivider: {
    width: 1,
    height: 18,
    backgroundColor: "#CBD5E1",
  },
  footer: {
    marginTop: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "700",
  },
});
