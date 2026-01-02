import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/services/api";
import { LoadErrorScreen } from "@/components/StateScreens";

type ApiExtractResponse = {
  fields: Record<string, string>;
  confidence: number;
};

type ApiUpdateResponse = {
  message: string;
  fields: Record<string, string>;
};

function clamp01(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function confidenceTone(conf: number) {
  const c = clamp01(conf);
  if (c >= 0.8) return "ok";
  if (c >= 0.6) return "warn";
  return "danger";
}

function confidenceLabel(conf: number) {
  const c = clamp01(conf);
  const pct = Math.round(c * 100);
  return `${pct}%`;
}

function IconButton({
  icon,
  onPress,
  disabled,
  tone = "neutral",
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  tone?: "neutral" | "blue";
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={[
        styles.iconBtn,
        tone === "blue" && styles.iconBtnBlue,
        disabled && { opacity: 0.5 },
      ]}
      hitSlop={10}
    >
      <Ionicons
        name={icon}
        size={18}
        color={tone === "blue" ? "#1D4ED8" : "#0F172A"}
      />
    </Pressable>
  );
}

function Pill({
  text,
  tone = "neutral",
  icon,
}: {
  text: string;
  tone?: "neutral" | "blue" | "ok" | "warn" | "danger";
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const toneStyle =
    tone === "blue"
      ? styles.pillBlue
      : tone === "ok"
      ? styles.pillOk
      : tone === "warn"
      ? styles.pillWarn
      : tone === "danger"
      ? styles.pillDanger
      : styles.pillNeutral;

  const textStyle =
    tone === "blue"
      ? styles.pillTextBlue
      : tone === "ok"
      ? styles.pillTextOk
      : tone === "warn"
      ? styles.pillTextWarn
      : tone === "danger"
      ? styles.pillTextDanger
      : styles.pillTextNeutral;

  const iconColor =
    tone === "blue"
      ? "#1D4ED8"
      : tone === "ok"
      ? "#047857"
      : tone === "warn"
      ? "#92400E"
      : tone === "danger"
      ? "#B91C1C"
      : "#334155";

  return (
    <View style={[styles.pill, toneStyle]}>
      {icon ? <Ionicons name={icon} size={14} color={iconColor} /> : null}
      <Text style={[styles.pillText, textStyle]}>{text}</Text>
    </View>
  );
}

function prettyKey(key: string) {
  // "DataEmissao" -> "Data Emissão"
  const withSpaces = key.replace(/([a-z])([A-Z])/g, "$1 $2");
  return withSpaces.replaceAll("_", " ").replace(/\s+/g, " ").trim();
}

function fieldIcon(key: string): keyof typeof Ionicons.glyphMap {
  const k = key.toLowerCase();
  if (
    k.includes("data") ||
    k.includes("validade") ||
    k.includes("inicio") ||
    k.includes("fim")
  )
    return "calendar-outline";
  if (k.includes("numero") || k.includes("codigo") || k.includes("apolice"))
    return "key-outline";
  if (
    k.includes("morada") ||
    k.includes("localizacao") ||
    k.includes("concelho") ||
    k.includes("freguesia")
  )
    return "location-outline";
  if (
    k.includes("valor") ||
    k.includes("premio") ||
    k.includes("renda") ||
    k.includes("quota")
  )
    return "cash-outline";
  if (
    k.includes("entidade") ||
    k.includes("seguradora") ||
    k.includes("fornecedor") ||
    k.includes("cartorio")
  )
    return "business-outline";
  if (
    k.includes("titular") ||
    k.includes("comprador") ||
    k.includes("vendedor") ||
    k.includes("inquilino") ||
    k.includes("senhorio")
  )
    return "people-outline";
  if (k.includes("classe") || k.includes("energet")) return "flash-outline";
  return "document-text-outline";
}

function FieldRow({
  k,
  value,
  onChange,
}: {
  k: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const icon = fieldIcon(k);
  const hasValue = !!value?.trim();

  const status = hasValue ? "filled" : "empty";

  return (
    <View style={styles.fieldCard}>
      {/* Header */}
      <View style={styles.fieldTop}>
        <View style={styles.fieldIcon}>
          <Ionicons name={icon} size={18} color="#1D4ED8" />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.fieldLabel}>{prettyKey(k)}</Text>
          <Text style={styles.fieldKey} numberOfLines={1}>
            {k}
          </Text>
        </View>

        {/* Status pill */}
        {hasValue ? (
          <View style={[styles.fieldStatus, styles.fieldStatusOk]}>
            <Ionicons name="sparkles-outline" size={14} color="#047857" />
            <Text style={styles.fieldStatusTextOk}>IA</Text>
          </View>
        ) : (
          <View style={[styles.fieldStatus, styles.fieldStatusEmpty]}>
            <Ionicons name="alert-circle-outline" size={14} color="#B91C1C" />
            <Text style={styles.fieldStatusTextEmpty}>Em falta</Text>
          </View>
        )}
      </View>

      {/* Input */}
      <View style={styles.fieldInputWrap}>
        <TextInput
          value={value ?? ""}
          onChangeText={onChange}
          placeholder="Não encontrado no documento"
          placeholderTextColor="#94A3B8"
          style={styles.fieldInput}
          multiline
        />

        {hasValue ? (
          <Pressable
            onPress={() => onChange("")}
            hitSlop={10}
            style={styles.clearBtn}
          >
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </Pressable>
        ) : null}
      </View>

      {/* Helper */}
      <Text style={styles.fieldHint}>
        {hasValue
          ? "Revê este valor e corrige se necessário."
          : "A IA não encontrou este valor no documento."}
      </Text>
    </View>
  );
}

export default function DocumentAiFieldsEditScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = String(params.id ?? "");
  const qc = useQueryClient();

  // local editable state
  const [localFields, setLocalFields] = useState<Record<string, string>>({});
  const [confidence, setConfidence] = useState<number>(0);

  const initializedRef = useRef(false);

  // Load current document (assumo que tens endpoint GET /documents/{id})
  // Se não tiveres, troca para o teu hook getDocumentById.
  const docQuery = useQuery({
    queryKey: ["document", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await api.get(`/documents/${id}`);
      return res.data;
    },
    staleTime: 1000 * 30,
  });

  const extractedFromDoc = useMemo(() => {
    const f =
      docQuery.data?.extractedFields ?? docQuery.data?.ExtractedFields ?? null;
    return (f ?? {}) as Record<string, string>;
  }, [docQuery.data]);

  // init local fields once
  React.useEffect(() => {
    if (!docQuery.data) return;
    if (initializedRef.current) return;

    initializedRef.current = true;
    setLocalFields(extractedFromDoc || {});
    // se tiveres confidence guardado no doc, usa-o; senão, 0
    const c =
      docQuery.data?.aiConfidence ??
      docQuery.data?.AiConfidence ??
      docQuery.data?.confidence ??
      0;
    setConfidence(typeof c === "number" ? c : 0);
  }, [docQuery.data, extractedFromDoc]);

  const extractMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<ApiExtractResponse>(
        `/document/${id}/ai-extraction`
      );
      return res.data;
    },
    onSuccess: (data) => {
      setLocalFields(data.fields ?? {});
      setConfidence(data.confidence ?? 0);
      // refresca doc cache (se quiseres)
      qc.invalidateQueries({ queryKey: ["document", id] });
    },
    onError: () => {
      Alert.alert("Não foi possível", "Erro ao extrair campos com IA.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (fields: Record<string, string>) => {
      const res = await api.patch<ApiUpdateResponse>(
        `/documents/${id}/ai-fields`,
        {
          fields,
        }
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["document", id] });
      Alert.alert("Guardado ✅", "Campos atualizados com sucesso.");
      router.back();
    },
    onError: () => {
      Alert.alert("Não foi possível", "Erro ao guardar os campos.");
    },
  });

  const keys = useMemo(() => {
    const k = Object.keys(localFields || {});
    // mantém ordem estável (datas primeiro, depois resto)
    const score = (s: string) => {
      const t = s.toLowerCase();
      if (t.includes("data")) return 0;
      if (t.includes("numero") || t.includes("codigo")) return 1;
      if (t.includes("morada") || t.includes("local")) return 2;
      return 3;
    };
    return k.sort((a, b) => score(a) - score(b) || a.localeCompare(b));
  }, [localFields]);

  const hasFields = keys.length > 0;

  const dirty = useMemo(() => {
    const base = extractedFromDoc || {};
    const aKeys = Object.keys(base);
    const bKeys = Object.keys(localFields || {});
    if (aKeys.length !== bKeys.length) return true;

    for (const k of bKeys) {
      const a = (base[k] ?? "").trim();
      const b = (localFields[k] ?? "").trim();
      if (a !== b) return true;
    }
    return false;
  }, [extractedFromDoc, localFields]);

  const confTone = confidenceTone(confidence);

  const loading = docQuery.isLoading || docQuery.isFetching;
  console.log({ params });
  if (!id) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <LoadErrorScreen
          title="Documento inválido"
          subtitle="Volta atrás e tenta novamente."
          onRetry={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>A carregar campos…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (docQuery.error) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <LoadErrorScreen
          title="Erro ao carregar"
          subtitle="Tenta novamente mais tarde."
          onRetry={() => docQuery.refetch()}
        />
      </SafeAreaView>
    );
  }

  const docName =
    docQuery.data?.title ??
    docQuery.data?.name ??
    docQuery.data?.fileName ??
    "Campos do documento";

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <IconButton icon="arrow-back" onPress={() => router.back()} />
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Editar campos IA</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {docName}
              </Text>
            </View>

            <IconButton
              icon="sparkles-outline"
              tone="blue"
              onPress={() => extractMutation.mutate()}
              disabled={extractMutation.isPending}
            />
          </View>

          {/* Meta */}
          <View style={styles.metaRow}>
            <Pill
              tone="blue"
              icon="shield-checkmark-outline"
              text="Revê e confirma"
            />
            <Pill
              tone={
                confTone === "ok"
                  ? "ok"
                  : confTone === "warn"
                  ? "warn"
                  : "danger"
              }
              icon="analytics-outline"
              text={`Confiança: ${confidenceLabel(confidence)}`}
            />
          </View>

          {/* Banner / helper */}
          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color="#1D4ED8"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>Sugestão</Text>
              <Text style={styles.infoText}>
                Confirma os valores e corrige o que estiver errado. Podes tocar
                no ✨ para re-extrair com IA.
              </Text>
            </View>
          </View>

          {/* Empty state */}
          {!hasFields ? (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIcon}>
                <Ionicons name="sparkles-outline" size={22} color="#1D4ED8" />
              </View>
              <Text style={styles.emptyBoxTitle}>Ainda não há campos</Text>
              <Text style={styles.emptyBoxText}>
                Gera os campos com IA e depois edita aqui antes de guardar.
              </Text>

              <Pressable
                style={styles.primaryCta}
                onPress={() => extractMutation.mutate()}
                disabled={extractMutation.isPending}
              >
                {extractMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryCtaText}>Extrair com IA</Text>
                )}
              </Pressable>
            </View>
          ) : (
            <>
              {/* Fields */}
              <View style={{ marginTop: 8 }}>
                <Text style={styles.sectionTitle}>Campos</Text>

                {extractMutation.isPending ? (
                  <View style={styles.banner}>
                    <ActivityIndicator />
                    <Text style={styles.bannerTitle}>A extrair com IA…</Text>
                    <Text style={styles.bannerMessage}>
                      Isto pode demorar alguns segundos.
                    </Text>
                  </View>
                ) : null}

                {keys.map((k) => (
                  <FieldRow
                    key={k}
                    k={k}
                    value={localFields[k] ?? ""}
                    onChange={(v) =>
                      setLocalFields((prev) => ({ ...prev, [k]: v }))
                    }
                  />
                ))}

                <Pressable
                  style={[styles.secondaryCta, { marginTop: 8 }]}
                  onPress={() => {
                    // reset to server values
                    setLocalFields(extractedFromDoc || {});
                    Alert.alert("Reposto", "Voltaste aos valores guardados.");
                  }}
                  disabled={!dirty || updateMutation.isPending}
                >
                  <Ionicons name="refresh-outline" size={18} color="#0F172A" />
                  <Text style={styles.secondaryCtaText}>Repor alterações</Text>
                </Pressable>
              </View>
            </>
          )}

          <View style={{ height: 110 }} />
        </ScrollView>

        {/* Bottom save bar */}
        <View style={styles.bottomBar}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bottomTitle}>
              {dirty ? "Alterações por guardar" : "Tudo guardado"}
            </Text>
            <Text style={styles.bottomSub}>
              {dirty ? "Guarda para aplicar as correções." : "Sem alterações."}
            </Text>
          </View>

          <Pressable
            style={[
              styles.saveBtn,
              (!dirty || updateMutation.isPending || !hasFields) &&
                styles.saveBtnDisabled,
            ]}
            onPress={() => updateMutation.mutate(localFields)}
            disabled={!dirty || updateMutation.isPending || !hasFields}
          >
            {updateMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color="#fff" />
                <Text style={styles.saveBtnText}>Guardar</Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { padding: 16, paddingBottom: 24 },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 16,
  },
  loadingText: { color: "#64748B", fontWeight: "800" },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  title: { fontSize: 18, fontWeight: "900", color: "#0F172A" },
  subtitle: { marginTop: 2, fontSize: 12, color: "#64748B", fontWeight: "700" },

  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  iconBtnBlue: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },

  metaRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 12,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: { fontSize: 12, fontWeight: "900" },

  pillNeutral: { backgroundColor: "#F1F5F9", borderColor: "#E2E8F0" },
  pillTextNeutral: { color: "#334155" },

  pillBlue: { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" },
  pillTextBlue: { color: "#1D4ED8" },

  pillOk: { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" },
  pillTextOk: { color: "#047857" },

  pillWarn: { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" },
  pillTextWarn: { color: "#92400E" },

  pillDanger: { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
  pillTextDanger: { color: "#B91C1C" },

  infoCard: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 12,
    flexDirection: "row",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 1,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
  },
  infoTitle: { fontSize: 12, fontWeight: "900", color: "#0F172A" },
  infoText: {
    marginTop: 2,
    fontSize: 12.5,
    color: "#475569",
    fontWeight: "600",
    lineHeight: 18,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 10,
  },

  banner: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bannerTitle: { fontWeight: "900", color: "#0F172A" },
  bannerMessage: { marginTop: 2, color: "#475569", lineHeight: 18 },

  fieldCard: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    padding: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 1,
  },
  fieldTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  fieldIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
  },
  fieldLabel: { fontSize: 13, fontWeight: "900", color: "#0F172A" },
  fieldKey: { marginTop: 2, fontSize: 11, color: "#94A3B8", fontWeight: "800" },

  fieldInputWrap: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  fieldInput: {
    flex: 1,
    fontSize: 13,
    color: "#0F172A",
    fontWeight: "700",
    lineHeight: 18,
    padding: 0,
    minHeight: 38,
  },
  clearBtn: {
    paddingTop: 2,
  },

  emptyBox: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginTop: 12,
    alignItems: "center",
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 18,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  emptyBoxTitle: { fontSize: 14, fontWeight: "900", color: "#0F172A" },
  emptyBoxText: {
    marginTop: 6,
    fontSize: 13,
    color: "#475569",
    fontWeight: "600",
    lineHeight: 18,
    textAlign: "center",
  },

  primaryCta: {
    marginTop: 12,
    backgroundColor: "#0F172A",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 160,
  },
  primaryCtaText: { color: "#fff", fontWeight: "900" },

  secondaryCta: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  secondaryCtaText: { fontWeight: "900", color: "#0F172A" },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 14,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  bottomTitle: { fontSize: 12, fontWeight: "900", color: "#0F172A" },
  bottomSub: {
    marginTop: 2,
    fontSize: 12,
    color: "#64748B",
    fontWeight: "700",
  },

  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#2563EB",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  saveBtnDisabled: {
    backgroundColor: "#94A3B8",
  },
  saveBtnText: { color: "#fff", fontWeight: "900" },

  emptyTitle: { fontSize: 16, fontWeight: "900", color: "#0F172A" },
  emptyText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "700",
    lineHeight: 18,
    textAlign: "center",
  },
  fieldStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },

  fieldStatusOk: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },

  fieldStatusEmpty: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },

  fieldStatusTextOk: {
    fontSize: 11,
    fontWeight: "900",
    color: "#047857",
  },

  fieldStatusTextEmpty: {
    fontSize: 11,
    fontWeight: "900",
    color: "#B91C1C",
  },

  fieldHint: {
    marginTop: 6,
    fontSize: 11.5,
    color: "#64748B",
    fontWeight: "700",
  },
});
