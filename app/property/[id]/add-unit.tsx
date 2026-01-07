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
import { useLocalSearchParams, useRouter } from "expo-router";
import { api } from "@/hooks/services/api";

/**
 * POST /property/{buildingId}/units
 * body:
 * {
 *   name: string
 * }
 */

export default function AddUnitToBuildingScreen() {
  const router = useRouter();
  const { id: buildingId } = useLocalSearchParams<{ id: string }>();

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSave() {
    if (!name.trim()) {
      setError("O nome da fração é obrigatório.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await api.post(`/property/${buildingId}/units`, {
        name: name.trim(),
      });

      router.back();
    } catch (e: any) {
      setError(
        e?.response?.data?.message ??
          "Não foi possível criar a fração. Tenta novamente."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable style={styles.iconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={18} />
          </Pressable>
        </View>

        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="business-outline" size={22} color="#1D4ED8" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Adicionar fração</Text>
              <Text style={styles.subtitle}>
                Cria uma fração dentro deste prédio.
              </Text>
            </View>
          </View>

          {/* Info */}
          <View style={styles.infoBox}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color="#64748B"
            />
            <Text style={styles.infoText}>
              Cada fração funciona como um imóvel independente, com os seus
              próprios documentos, alertas e partilhas.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.label}>Nome da fração</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="home-outline" size={18} color="#64748B" />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Ex: Fração A, T2 - 1º Esq"
                placeholderTextColor="#94A3B8"
                style={styles.input}
                editable={!saving}
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          {/* CTA */}
          <Pressable
            style={[styles.primaryCta, saving && styles.ctaDisabled]}
            onPress={onSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryCtaText}>Criar fração</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ---------------------------------- */
/* Styles                             */
/* ---------------------------------- */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },

  topBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
  },

  container: {
    flex: 1,
    padding: 16,
  },

  header: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },

  title: { fontSize: 20, fontWeight: "900", color: "#0F172A" },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },

  infoBox: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 18,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: "#475569",
    fontWeight: "600",
  },

  form: {
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },

  errorText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "700",
    color: "#EF4444",
  },

  primaryCta: {
    marginTop: "auto",
    backgroundColor: "#111",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryCtaText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 14,
  },
  ctaDisabled: {
    opacity: 0.7,
  },
});
