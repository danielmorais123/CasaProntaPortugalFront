import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/services/api";

/**
 * Esperado do backend (ajusta conforme a tua API):
 * GET /documents/:id/ai-extraction
 * {
 *   fields: { [key: string]: string },
 *   confidence: number
 * }
 *
 * PATCH /documents/:id/ai-fields
 * { fields: { [key: string]: string } }
 */

type ExtractionResponse = {
  fields: Record<string, string>;
  confidence: number;
};

function confidenceLabel(c: number) {
  if (c >= 0.85) return { text: "Alta confiança", tone: "good" as const };
  if (c >= 0.65) return { text: "Confiança média", tone: "warn" as const };
  return { text: "Baixa confiança", tone: "bad" as const };
}

function Pill({
  text,
  tone = "neutral",
  icon,
}: {
  text: string;
  tone?: "neutral" | "good" | "warn" | "bad" | "blue";
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View
      style={[
        styles.pill,
        tone === "blue" && styles.pillBlue,
        tone === "good" && styles.pillGood,
        tone === "warn" && styles.pillWarn,
        tone === "bad" && styles.pillBad,
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={14}
          color={
            tone === "blue"
              ? "#1D4ED8"
              : tone === "good"
              ? "#047857"
              : tone === "warn"
              ? "#92400E"
              : tone === "bad"
              ? "#991B1B"
              : "#334155"
          }
        />
      ) : null}
      <Text
        style={[
          styles.pillText,
          tone === "blue" && styles.pillTextBlue,
          tone === "good" && styles.pillTextGood,
          tone === "warn" && styles.pillTextWarn,
          tone === "bad" && styles.pillTextBad,
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

function FieldRow({
  k,
  value,
  onChange,
  emptyHint,
}: {
  k: string;
  value: string;
  onChange: (v: string) => void;
  emptyHint?: boolean;
}) {
  const isEmpty = !value?.trim();

  return (
    <View style={[styles.fieldRow, isEmpty && styles.fieldRowEmpty]}>
      <View style={styles.fieldLeft}>
        <View style={[styles.fieldIcon, isEmpty && styles.fieldIconEmpty]}>
          <Ionicons
            name={isEmpty ? "help-circle-outline" : "checkmark-circle-outline"}
            size={16}
            color={isEmpty ? "#92400E" : "#047857"}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.fieldKey} numberOfLines={1}>
            {k}
          </Text>
          {emptyHint && isEmpty ? (
            <Text style={styles.fieldHint}>
              A IA não conseguiu encontrar isto.
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.fieldInputWrap}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="—"
          placeholderTextColor="#94A3B8"
          style={styles.fieldInput}
        />
      </View>
    </View>
  );
}

export default function AiReviewScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const docId = String(id ?? "");
  const qc = useQueryClient();

  const [localFields, setLocalFields] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["document-ai", docId],
    enabled: !!docId,
    queryFn: async (): Promise<ExtractionResponse> => {
      const res = await api.get(`/documents/${docId}/ai-extraction`);
      return res.data;
    },
    onSuccess: (d) => {
      setLocalFields(d.fields ?? {});
      setDirty(false);
    },
    staleTime: 1000 * 60 * 2,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      return api.patch(`/documents/${docId}/ai-fields`, {
        fields: localFields,
      });
    },
    onSuccess: async () => {
      setDirty(false);
      await qc.invalidateQueries({ queryKey: ["document-ai", docId] });
      // opcional: voltar ao detalhe do documento
      router.back();
    },
  });

  const sortedKeys = useMemo(() => {
    const keys = Object.keys(localFields ?? {});
    // “Campos importantes” no topo (heurística simples)
    const priority = [
      "MoradaImovel",
      "DataValidade",
      "DataEmissao",
      "NumeroCertificado",
      "NumeroLicenca",
      "CodigoCertidao",
      "NumeroApolice",
      "AnoReferencia",
      "ValorPago",
    ];
    return keys.sort((a, b) => {
      const pa = priority.indexOf(a);
      const pb = priority.indexOf(b);
      if (pa === -1 && pb === -1) return a.localeCompare(b);
      if (pa === -1) return 1;
      if (pb === -1) return -1;
      return pa - pb;
    });
  }, [localFields]);

  const missingCount = useMemo(() => {
    return sortedKeys.filter((k) => !(localFields[k] ?? "").trim()).length;
  }, [sortedKeys, localFields]);

  const confidence = data?.confidence ?? 0;
  const conf = confidenceLabel(confidence);

  const onRefresh = async () => {
    await refetch();
  };

  const setField = (k: string, v: string) => {
    setLocalFields((prev) => ({ ...prev, [k]: v }));
    setDirty(true);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>
            A IA está a preparar os campos…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={[styles.container, { flex: 1, justifyContent: "center" }]}>
          <View style={styles.errorCard}>
            <View style={styles.errorTopRow}>
              <View style={styles.errorIconWrap}>
                <Ionicons name="alert-circle" size={18} color="#B91C1C" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.errorTitle}>
                  Não foi possível obter os campos
                </Text>
                <Text style={styles.errorText}>
                  Tenta novamente. Se continuar, faz upload outra vez.
                </Text>
              </View>
            </View>

            <Pressable style={styles.primaryCta} onPress={onRefresh}>
              <Text style={styles.primaryCtaText}>Tentar novamente</Text>
            </Pressable>
          </View>

          <Pressable onPress={() => router.back()} style={styles.secondaryCta}>
            <Text style={styles.secondaryCtaText}>Voltar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable
            style={styles.iconBtn}
            onPress={() => router.back()}
            hitSlop={10}
          >
            <Ionicons name="arrow-back" size={18} color="#0F172A" />
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Revisão da IA</Text>
            <Text style={styles.subtitle}>
              Confirma os campos antes de guardar no documento.
            </Text>
          </View>

          <View style={styles.headerBadge}>
            <Ionicons name="sparkles-outline" size={18} color="#1D4ED8" />
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View style={styles.summaryIcon}>
              <Ionicons
                name="document-text-outline"
                size={18}
                color="#0F172A"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.summaryTitle}>Campos extraídos</Text>
              <Text style={styles.summaryMeta}>
                {sortedKeys.length} campos • {missingCount} em falta
              </Text>
            </View>

            <Pill
              text={`${Math.round(confidence * 100)}%`}
              tone={
                conf.tone === "good"
                  ? "good"
                  : conf.tone === "warn"
                  ? "warn"
                  : "bad"
              }
              icon={
                conf.tone === "good"
                  ? "checkmark-circle-outline"
                  : "alert-circle-outline"
              }
            />
          </View>

          <View style={styles.pillsRow}>
            <Pill
              text={conf.text}
              tone={
                conf.tone === "good"
                  ? "good"
                  : conf.tone === "warn"
                  ? "warn"
                  : "bad"
              }
              icon="shield-checkmark-outline"
            />
            {missingCount > 0 ? (
              <Pill
                text={`${missingCount} por preencher`}
                tone="warn"
                icon="help-circle-outline"
              />
            ) : (
              <Pill
                text="Tudo preenchido"
                tone="good"
                icon="checkmark-done-outline"
              />
            )}
          </View>

          <Text style={styles.summaryHint}>
            Dica: se um campo estiver vazio, podes preenchê-lo manualmente.
          </Text>
        </View>

        {/* Fields */}
        <Text style={styles.sectionTitle}>Campos</Text>

        <View style={styles.fieldsCard}>
          {sortedKeys.map((k) => (
            <FieldRow
              key={k}
              k={k}
              value={localFields[k] ?? ""}
              onChange={(v) => setField(k, v)}
              emptyHint
            />
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            style={[
              styles.primaryCta,
              (saveMutation.isPending || !dirty) && styles.primaryCtaDisabled,
            ]}
            disabled={saveMutation.isPending || !dirty}
            onPress={() => saveMutation.mutate()}
          >
            <Ionicons
              name="save-outline"
              size={18}
              color={saveMutation.isPending || !dirty ? "#94A3B8" : "#FFFFFF"}
            />
            <Text
              style={[
                styles.primaryCtaText,
                (saveMutation.isPending || !dirty) &&
                  styles.primaryCtaTextDisabled,
              ]}
            >
              {saveMutation.isPending ? "A guardar…" : "Guardar campos"}
            </Text>
          </Pressable>

          <Pressable
            style={styles.secondaryCta}
            onPress={() => {
              setLocalFields(data.fields ?? {});
              setDirty(false);
            }}
            disabled={saveMutation.isPending}
          >
            <Ionicons name="refresh-outline" size={18} color="#0F172A" />
            <Text style={styles.secondaryCtaText}>Repor</Text>
          </Pressable>
        </View>

        <View style={{ height: 28 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { padding: 16, paddingBottom: 28 },

  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  loadingText: { color: "#64748B", fontWeight: "800" },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  title: { fontSize: 22, fontWeight: "900", color: "#0F172A" },
  subtitle: { marginTop: 4, fontSize: 13, color: "#64748B", lineHeight: 18 },

  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  headerBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
  },

  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  pillText: { fontSize: 12, fontWeight: "900", color: "#334155" },

  pillBlue: { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" },
  pillTextBlue: { color: "#1D4ED8" },

  pillGood: { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" },
  pillTextGood: { color: "#047857" },

  pillWarn: { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" },
  pillTextWarn: { color: "#92400E" },

  pillBad: { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
  pillTextBad: { color: "#991B1B" },

  summaryCard: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 12,
  },
  summaryTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  summaryIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryTitle: { fontSize: 14, fontWeight: "900", color: "#0F172A" },
  summaryMeta: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  pillsRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 10 },
  summaryHint: {
    marginTop: 10,
    fontSize: 12,
    color: "#475569",
    fontWeight: "600",
    lineHeight: 16,
  },

  sectionTitle: {
    marginTop: 4,
    marginBottom: 10,
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },

  fieldsCard: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    overflow: "hidden",
  },

  fieldRow: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#EEF2F7",
    backgroundColor: "#FFFFFF",
  },
  fieldRowEmpty: {
    backgroundColor: "#FFFBEB",
  },
  fieldLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  fieldIcon: {
    width: 34,
    height: 34,
    borderRadius: 14,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    alignItems: "center",
    justifyContent: "center",
  },
  fieldIconEmpty: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },
  fieldKey: { fontSize: 13, fontWeight: "900", color: "#0F172A" },
  fieldHint: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "700",
    color: "#92400E",
  },

  fieldInputWrap: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  fieldInput: { fontSize: 14, color: "#0F172A", fontWeight: "700" },

  actions: { marginTop: 12, gap: 10 },
  primaryCta: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F172A",
    borderRadius: 16,
    paddingVertical: 14,
  },
  primaryCtaDisabled: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  primaryCtaText: { color: "#FFFFFF", fontWeight: "900" },
  primaryCtaTextDisabled: { color: "#94A3B8" },

  secondaryCta: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 14,
  },
  secondaryCtaText: { color: "#0F172A", fontWeight: "900" },

  errorCard: {
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  errorTopRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  errorIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 16,
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FECACA",
    alignItems: "center",
    justifyContent: "center",
  },
  errorTitle: { fontSize: 13, fontWeight: "900", color: "#7F1D1D" },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700",
    color: "#991B1B",
    lineHeight: 16,
  },
});
