import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Platform,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// If you have these helpers, use them. Otherwise replace with api.get in queryFn.
import { api } from "@/hooks/services/api";
// import { getDocumentById } from "@/hooks/services/documents"; // <- if exists
import { LoadErrorScreen } from "@/components/StateScreens";
import { getAllDocuments, getDocumentById } from "@/hooks/services/document";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type AiField = { key: string; value: string; confidence?: number };

// ---- helpers ----
function docTypeLabel(type: number) {
  switch (type) {
    case 1:
      return "Caderneta Predial";
    case 2:
      return "Certidão Permanente";
    case 3:
      return "Escritura / Título";
    case 4:
      return "Licença / Isenção";
    case 5:
      return "Certificado Energético";
    case 9:
      return "Comprovativo IMI";
    case 20:
      return "Contrato Arrendamento";
    case 40:
      return "Planta Localização";
    case 60:
      return "Regulamento Condomínio";
    case 61:
      return "Atas Condomínio";
    default:
      return "Documento";
  }
}

function formatDateMaybe(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-PT");
}

function statusFromExpiration(exp?: string) {
  if (!exp)
    return {
      label: "Sem validade",
      tone: "neutral" as const,
      icon: "remove-circle-outline" as const,
    };
  const d = new Date(exp);
  if (Number.isNaN(d.getTime()))
    return {
      label: "Validade desconhecida",
      tone: "neutral" as const,
      icon: "help-circle-outline" as const,
    };
  const now = new Date();
  const diffDays = Math.ceil(
    (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays < 0)
    return {
      label: "Expirado",
      tone: "danger" as const,
      icon: "alert-circle-outline" as const,
    };
  if (diffDays <= 30)
    return {
      label: `Expira em ${diffDays} dias`,
      tone: "warn" as const,
      icon: "time-outline" as const,
    };
  return {
    label: "Válido",
    tone: "ok" as const,
    icon: "checkmark-circle-outline" as const,
  };
}

function confidenceTone(conf?: number) {
  const c = conf ?? 0;
  if (c >= 0.85)
    return {
      label: "Alta",
      color: "#047857",
      bg: "#ECFDF5",
      border: "#A7F3D0",
    };
  if (c >= 0.6)
    return {
      label: "Média",
      color: "#92400E",
      bg: "#FFFBEB",
      border: "#FDE68A",
    };
  return { label: "Baixa", color: "#B91C1C", bg: "#FEF2F2", border: "#FECACA" };
}

function Pill({
  text,
  tone = "neutral",
  icon,
}: {
  text: string;
  tone?: "neutral" | "blue" | "warn" | "danger" | "ok";
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const t = tone;
  return (
    <View
      style={[
        styles.pill,
        t === "blue" && styles.pillBlue,
        t === "warn" && styles.pillWarn,
        t === "danger" && styles.pillDanger,
        t === "ok" && styles.pillOk,
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={14}
          color={
            t === "blue"
              ? "#1D4ED8"
              : t === "warn"
              ? "#92400E"
              : t === "danger"
              ? "#B91C1C"
              : t === "ok"
              ? "#047857"
              : "#334155"
          }
        />
      ) : null}
      <Text
        style={[
          styles.pillText,
          t === "blue" && styles.pillTextBlue,
          t === "warn" && styles.pillTextWarn,
          t === "danger" && styles.pillTextDanger,
          t === "ok" && styles.pillTextOk,
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

function SectionHeader({
  title,
  actionText,
  onAction,
}: {
  title: string;
  actionText?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionText && onAction ? (
        <Pressable onPress={onAction} hitSlop={10}>
          <Text style={styles.sectionAction}>{actionText}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  variant = "secondary",
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={[
        styles.actionBtn,
        variant === "primary" && styles.actionBtnPrimary,
        variant === "ghost" && styles.actionBtnGhost,
        disabled && { opacity: 0.5 },
      ]}
      disabled={disabled}
    >
      <Ionicons
        name={icon}
        size={18}
        color={variant === "primary" ? "#FFFFFF" : "#0F172A"}
      />
      <Text
        style={[
          styles.actionBtnText,
          variant === "primary" && styles.actionBtnTextPrimary,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function FieldRow({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  highlight?: boolean;
}) {
  return (
    <View style={[styles.fieldRow, highlight && styles.fieldRowHighlight]}>
      <View style={[styles.fieldIcon, highlight && styles.fieldIconHighlight]}>
        <Ionicons
          name={icon}
          size={16}
          color={highlight ? "#1D4ED8" : "#64748B"}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue} numberOfLines={2}>
          {value || "—"}
        </Text>
      </View>
    </View>
  );
}

function EmptyStateInline({
  icon,
  title,
  text,
  actionText,
  onAction,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text: string;
  actionText?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.emptyInline}>
      <View style={styles.emptyInlineIcon}>
        <Ionicons name={icon} size={18} color="#1D4ED8" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.emptyInlineTitle}>{title}</Text>
        <Text style={styles.emptyInlineText}>{text}</Text>
      </View>
      {actionText && onAction ? (
        <Pressable
          onPress={onAction}
          hitSlop={10}
          style={styles.emptyInlineCta}
        >
          <Text style={styles.emptyInlineCtaText}>{actionText}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// ---- Screen ----
export default function DocumentDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  console.log({ params });
  const id = params.documentId;
  const [showAllFields, setShowAllFields] = useState(false);

  const {
    data: doc,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["document", id],
    enabled: !!id,
    queryFn: async () => {
      return await getDocumentById(id);
    },
    staleTime: 1000 * 60 * 2,
  });
  console.log({ f: doc.extractionConfidence });
  const onRefresh = async () => {
    await refetch();
  };

  const title = useMemo(() => docTypeLabel(doc?.type ?? 0), [doc?.type]);
  const expStatus = useMemo(
    () => statusFromExpiration(doc?.expirationDate),
    [doc?.expirationDate]
  );

  // AI fields can come from API:
  // - doc.aiFields (dictionary)
  // - doc.fields (dictionary)
  // Adapt this mapping to your backend return.
  const aiFields: AiField[] = useMemo(() => {
    const dict = (doc?.extractedFields ?? {}) as Record<string, string>;
    const entries = Object.entries(dict || {});
    return entries.map(([key, value]) => ({ key, value: value ?? "" }));
  }, [doc]);

  const aiConfidence: number = useMemo(() => {
    const c = doc?.extractionConfidence ?? 0;
    return typeof c === "number" ? c : 0;
  }, [doc]);

  const conf = confidenceTone(aiConfidence);
  const fieldsToRender = showAllFields ? aiFields : aiFields.slice(0, 8);

  const onToggleFields = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowAllFields((v) => !v);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>A carregar documento…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !doc) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <LoadErrorScreen
          title="Não foi possível carregar o documento"
          subtitle="Tenta novamente. Se continuar, pode ser um problema temporário do servidor."
          onRetry={onRefresh}
          details={String(error ?? "document not found")}
        />
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
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable
            style={styles.iconBtn}
            onPress={() => router.back()}
            hitSlop={10}
          >
            <Ionicons name="arrow-back" size={18} color="#0F172A" />
          </Pressable>

          <Text style={styles.topTitle} numberOfLines={1}>
            Documento
          </Text>

          <Pressable
            style={styles.iconBtn}
            onPress={() =>
              router.push({ pathname: "/documents/edit", params: { id } })
            }
            hitSlop={10}
          >
            <Ionicons name="create-outline" size={18} color="#0F172A" />
          </Pressable>
        </View>

        {/* Hero */}
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="document-text-outline" size={20} color="#1D4ED8" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle} numberOfLines={2}>
              {title}
            </Text>

            <Text style={styles.heroSub} numberOfLines={2}>
              {doc?.property.name ? `${doc.property.name} • ` : ""}
              {doc?.createdAt
                ? `Upload: ${formatDateMaybe(doc.createdAt)}`
                : "—"}
            </Text>

            <View style={styles.pillsRow}>
              <Pill
                text={expStatus.label}
                tone={
                  expStatus.tone === "danger"
                    ? "danger"
                    : expStatus.tone === "warn"
                    ? "warn"
                    : expStatus.tone === "ok"
                    ? "ok"
                    : "neutral"
                }
                icon={expStatus.icon}
              />
              <Pill
                text={
                  doc?.expirationDate
                    ? `Validade: ${formatDateMaybe(doc.expirationDate)}`
                    : "Sem validade"
                }
                tone="neutral"
                icon="calendar-outline"
              />
            </View>
          </View>
        </View>

        {/* Quick actions */}
        <View style={styles.actionsRow}>
          <ActionButton
            icon="eye-outline"
            label="Ver ficheiro"
            variant="primary"
            onPress={() => {
              // open a viewer screen or external URL
              // e.g. router.push({ pathname: "/documents/viewer", params: { id } })
              if (doc?.fileUrl)
                router.push({
                  pathname: "/documents/viewer",
                  params: { url: doc.fileUrl },
                });
            }}
            disabled={!doc?.fileUrl}
          />
          <ActionButton
            icon="share-outline"
            label="Partilhar"
            onPress={() => {
              // route to your share page (not modal)
              router.push({ pathname: "/documents/share", params: { id } });
            }}
          />
          <ActionButton
            icon="link-outline"
            label="Abrir imóvel"
            variant="ghost"
            onPress={() => {
              if (doc?.propertyId) router.push(`/property/${doc.propertyId}`);
            }}
            disabled={!doc?.propertyId}
          />
        </View>

        {/* AI section */}
        <SectionHeader
          title="IA — Campos extraídos"
          actionText={
            aiFields.length > 0
              ? showAllFields
                ? "Ver menos"
                : "Ver tudo"
              : undefined
          }
          onAction={aiFields.length > 0 ? onToggleFields : undefined}
        />

        <View style={styles.aiCard}>
          <View style={styles.aiTopRow}>
            <View style={styles.aiTitleRow}>
              <View style={styles.aiBadgeIcon}>
                <Ionicons name="sparkles-outline" size={18} color="#1D4ED8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.aiTitle}>Sugestões da IA</Text>
                <Text style={styles.aiSub}>
                  Confere os campos antes de guardar.
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.confBadge,
                { backgroundColor: conf.bg, borderColor: conf.border },
              ]}
            >
              <Text style={[styles.confText, { color: conf.color }]}>
                Confiança: {conf.label}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {aiFields.length === 0 ? (
            <EmptyStateInline
              icon="sparkles-outline"
              title="Ainda não há extração"
              text="A IA pode demorar alguns segundos após o upload. Recarrega ou volta mais tarde."
              actionText="Recarregar"
              onAction={onRefresh}
            />
          ) : (
            <View style={{ gap: 10 }}>
              {fieldsToRender.map((f) => (
                <FieldRow
                  key={f.key}
                  label={humanizeKey(f.key)}
                  value={f.value}
                  icon={iconForKey(f.key)}
                  highlight={!!f.value}
                />
              ))}

              {aiFields.length > 8 ? (
                <Pressable onPress={onToggleFields} style={styles.showMoreBtn}>
                  <Text style={styles.showMoreText}>
                    {showAllFields
                      ? "Mostrar menos"
                      : `Mostrar mais (${aiFields.length - 8})`}
                  </Text>
                  <Ionicons
                    name={showAllFields ? "chevron-up" : "chevron-down"}
                    size={16}
                    color="#1D4ED8"
                  />
                </Pressable>
              ) : null}
            </View>
          )}

          <View style={styles.aiActions}>
            <Pressable
              style={styles.primaryCta}
              onPress={() =>
                router.push({
                  pathname: "/documents/confirm-fields",
                  params: { id },
                })
              }
              disabled={aiFields.length === 0}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color="#fff"
              />
              <Text style={styles.primaryCtaText}>Confirmar campos</Text>
            </Pressable>

            <Pressable
              style={styles.secondaryCta}
              onPress={() =>
                router.push({
                  pathname: "/property/[id]/documents/[documentId]/ai-fields",
                  params: { id },
                })
              }
              // disabled={aiFields.length === 0}
            >
              <Ionicons name="create-outline" size={18} color="#0F172A" />
              <Text style={styles.secondaryCtaText}>Editar</Text>
            </Pressable>
          </View>
        </View>

        {/* Metadata */}
        {/* <SectionHeader title="Detalhes" />

        <View style={styles.detailsCard}>
          <DetailLine icon="document-outline" label="Tipo" value={title} />
          <View style={styles.detailsDivider} />
          <DetailLine
            icon="time-outline"
            label="Upload"
            value={formatDateMaybe(doc.createdAt)}
          />
          <View style={styles.detailsDivider} />
          <DetailLine
            icon="calendar-outline"
            label="Validade"
            value={
              doc.expirationDate ? formatDateMaybe(doc.expirationDate) : "—"
            }
            valueTone={expStatus.tone}
          />
        </View> */}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
function DetailLine({
  icon,
  label,
  value,
  valueTone = "neutral",
  mono,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  valueTone?: "neutral" | "ok" | "warn" | "danger";
  mono?: boolean;
}) {
  const toneStyle =
    valueTone === "ok"
      ? { color: "#047857" }
      : valueTone === "warn"
      ? { color: "#92400E" }
      : valueTone === "danger"
      ? { color: "#B91C1C" }
      : { color: "#0F172A" };

  return (
    <View style={styles.detailLine}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={16} color="#64748B" />
      </View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text
        style={[styles.detailValue, toneStyle, mono && styles.detailMono]}
        numberOfLines={1}
      >
        {value || "—"}
      </Text>
    </View>
  );
}

// ---- nice key labels + icons ----
function humanizeKey(key: string) {
  const map: Record<string, string> = {
    DataEmissao: "Data de emissão",
    DataValidade: "Data de validade",
    ClasseEnergetica: "Classe energética",
    NumeroCertificado: "Nº certificado",
    EntidadeEmissora: "Entidade emissora",
    TecnicoResponsavel: "Técnico responsável",
    MoradaImovel: "Morada do imóvel",
    ArtigoMatricial: "Artigo matricial",
    Fracao: "Fração",
    Concelho: "Concelho",
    Freguesia: "Freguesia",
    AreaTotal: "Área total",
    VPT: "VPT",
    AnoConstrucao: "Ano construção",
    Afetacao: "Afetação",
    ServicoFinancas: "Serviço de finanças",
    ValorPago: "Valor pago",
    DataPagamento: "Data pagamento",
    CodigoCertidao: "Código certidão",
    OneracoesEncargos: "Ónus/encargos",
    Titulares: "Titulares",
    DescricaoPredio: "Descrição do prédio",
  };

  if (map[key]) return map[key];

  // fallback: split camel-ish
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .trim();
}

function iconForKey(key: string): keyof typeof Ionicons.glyphMap {
  const k = key.toLowerCase();
  if (k.includes("data")) return "calendar-outline";
  if (k.includes("morada") || k.includes("localizacao"))
    return "location-outline";
  if (k.includes("valor") || k.includes("vpt") || k.includes("premio"))
    return "cash-outline";
  if (k.includes("numero") || k.includes("codigo")) return "barcode-outline";
  if (k.includes("entidade") || k.includes("servico"))
    return "business-outline";
  if (
    k.includes("titular") ||
    k.includes("comprador") ||
    k.includes("vendedor")
  )
    return "people-outline";
  return "information-circle-outline";
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { padding: 16, paddingBottom: 24 },

  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  loadingText: { color: "#64748B", fontWeight: "800" },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
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
  topTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A",
  },

  heroCard: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 14,
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 18,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: { fontSize: 16, fontWeight: "900", color: "#0F172A" },
  heroSub: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    lineHeight: 16,
  },

  pillsRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 10 },
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

  pillWarn: { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" },
  pillTextWarn: { color: "#92400E" },

  pillDanger: { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
  pillTextDanger: { color: "#B91C1C" },

  pillOk: { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" },
  pillTextOk: { color: "#047857" },

  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    flexWrap: "wrap",
  },
  actionBtn: {
    flexGrow: 1,
    flexBasis: "30%",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionBtnPrimary: { backgroundColor: "#0F172A", borderColor: "#0F172A" },
  actionBtnGhost: { backgroundColor: "#F1F5F9" },
  actionBtnText: { fontWeight: "900", color: "#0F172A" },
  actionBtnTextPrimary: { color: "#FFFFFF" },

  sectionHeader: {
    marginTop: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: "900", color: "#0F172A" },
  sectionAction: { fontSize: 13, fontWeight: "900", color: "#1D4ED8" },

  aiCard: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  aiTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  aiTitleRow: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  aiBadgeIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
  },
  aiTitle: { fontSize: 14, fontWeight: "900", color: "#0F172A" },
  aiSub: { marginTop: 2, fontSize: 12, fontWeight: "700", color: "#64748B" },

  confBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  confText: { fontSize: 12, fontWeight: "900" },

  divider: { height: 1, backgroundColor: "#EEF2F7", marginVertical: 12 },

  fieldRow: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  fieldRowHighlight: {
    backgroundColor: "#F8FAFF",
    borderColor: "#BFDBFE",
  },
  fieldIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  fieldIconHighlight: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },
  fieldLabel: { fontSize: 12, fontWeight: "900", color: "#334155" },
  fieldValue: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },

  showMoreBtn: {
    marginTop: 2,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  showMoreText: { fontWeight: "900", color: "#1D4ED8" },

  aiActions: { marginTop: 12, gap: 10 },
  primaryCta: {
    backgroundColor: "#0F172A",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryCtaText: { color: "#fff", fontWeight: "900" },

  secondaryCta: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    gap: 8,
  },
  secondaryCtaText: { color: "#0F172A", fontWeight: "900" },

  metaCard: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 14,
    gap: 10,
  },

  emptyInline: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  emptyInlineIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyInlineTitle: { fontSize: 13, fontWeight: "900", color: "#0F172A" },
  emptyInlineText: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    lineHeight: 16,
  },
  emptyInlineCta: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "#0F172A",
  },
  emptyInlineCtaText: { color: "#fff", fontWeight: "900", fontSize: 12 },
  detailsCard: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
  },
  detailsDivider: { height: 1, backgroundColor: "#EEF2F7" },
  detailLine: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 10,
  },
  detailIcon: {
    width: 34,
    height: 34,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: "#64748B",
    width: 70,
  },
  detailValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: "900",
    textAlign: "right",
  },
  detailMono: {
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }),
    letterSpacing: 0.2,
  },
});
