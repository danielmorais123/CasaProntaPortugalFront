// ProfileScreen.tsx
import React, { useCallback, useContext, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/Button";
import { Alert } from "@/components/Alert";
import { AuthContext } from "@/context/AuthContext";
import { api } from "@/hooks/services/api";
import { formatPrice, planCodeToId } from "@/utils/plan";
import { initialsFromName } from "@/utils/user";
import type { SubscriptionPlanDto } from "@/types/models";
import { updateProfile } from "@/hooks/services/user";

async function getPlans(): Promise<SubscriptionPlanDto[]> {
  const res = await api.get("/subscriptions/plans");
  return res.data;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useContext(AuthContext);

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");

  // subscription info (from user)
  const planName = user?.planName || user?.plan?.name || "FREE";
  const maxProperties = user?.plan?.limits?.MaxProperties ?? 1;
  const maxDocuments = user?.plan?.limits?.MaxDocuments ?? 20;

  const [alertMessage, setAlertMessage] = useState<{
    type: "success" | "destructive";
    message: string;
  } | null>(null);

  // plans via React Query
  const {
    data: plans = [],
    isLoading: plansLoading,
    error: plansErrorObj,
    refetch: refetchPlans,
  } = useQuery({
    queryKey: ["plans"],
    queryFn: getPlans,
    staleTime: 1000 * 60 * 10, // 10 min cache
  });

  const plansError = plansErrorObj
    ? "Não foi possível carregar os planos."
    : null;

  // sheet
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);
  const [selectedPlanCode, setSelectedPlanCode] = useState<string>("");
  const queryClient = useQueryClient();
  const currentPlanCode = useMemo(() => {
    const normalized = (planName ?? "").trim().toLowerCase();
    if (normalized.includes("free")) return "free";
    if (normalized.includes("starter")) return "starter";
    if (normalized.includes("pro")) return "pro";
    if (normalized.includes("business")) return "business";
    if (normalized.includes("portfolio")) return "portfolio";
    if (normalized.includes("enterprise")) return "enterprise";
    return "";
  }, [planName]);

  const currentPlanFromApi = useMemo(() => {
    const code = planCodeToId(currentPlanCode);
    return plans.find((p) => planCodeToId(p.code) === code);
  }, [plans, currentPlanCode]);

  // Get limits from current plan
  const propertyLimit =
    currentPlanFromApi?.limits?.maxProperties ?? maxProperties ?? 1;
  const documentLimit =
    currentPlanFromApi?.limits?.maxDocuments ?? maxDocuments ?? 20;

  // Get actual usage (replace with real values from backend/context)
  const propertyCount = user?.properties?.length ?? 0;
  const documentCount =
    user?.properties?.reduce((sum, p) => sum + (p.documents?.length ?? 0), 0) ??
    0;

  // Progress percentage
  const usagePctProps = Math.max(
    0,
    Math.min(1, propertyCount / Math.max(1, propertyLimit))
  );
  const usagePctDocs = Math.max(
    0,
    Math.min(1, documentCount / Math.max(1, documentLimit))
  );

  const openManage = async () => {
    // garante planos antes de abrir
    if (!plans.length && !plansLoading) await refetchPlans();

    const initial = currentPlanCode || plans?.[0]?.code || "free";
    setSelectedPlanCode(initial);
    setSubscriptionOpen(true);
  };

  const closeManage = () => setSubscriptionOpen(false);

  const handleConfirmPlanChange = () => {
    setSubscriptionOpen(false);
    router.push({
      pathname: "/payments/payment",
      params: { planCode: selectedPlanCode },
    });
  };

  const handleSave = async () => {
    try {
      await updateProfile({ name, email });
      await queryClient.invalidateQueries({ queryKey: ["user"] });
      setAlertMessage({
        type: "success",
        message: "Perfil atualizado com sucesso!",
      });
    } catch {
      setAlertMessage({
        type: "destructive",
        message: "Erro ao atualizar perfil.",
      });
    }
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <ScrollView contentContainerStyle={styles.container}>
        {alertMessage && (
          <Alert
            variant={
              alertMessage.type === "success" ? "success" : "destructive"
            }
            title={alertMessage.message}
          />
        )}

        {/* Header */}
        <View style={styles.headerCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initialsFromName(name)}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.headerName}>{name || "Utilizador"}</Text>
            <Text style={styles.headerEmail}>{email || "—"}</Text>

            <View style={styles.badgeRow}>
              <View style={styles.planBadge}>
                <Ionicons name="sparkles" size={14} color="#1D4ED8" />
                <Text style={styles.planBadgeText}>
                  {currentPlanFromApi?.name ?? planName}
                </Text>
              </View>

              {currentPlanFromApi?.isPopular ? (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>POPULAR</Text>
                </View>
              ) : null}
            </View>
          </View>

          <Pressable
            onPress={() => router.push("/settings")}
            style={styles.iconBtn}
          >
            <Ionicons name="settings-outline" size={20} color="#0F172A" />
          </Pressable>
        </View>

        {/* Subscription Summary */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Subscrição</Text>
              <Text style={styles.cardSubtitle}>
                {formatPrice(currentPlanFromApi)} ·{" "}
                {currentPlanFromApi?.description ?? "—"}
              </Text>
            </View>

            <Pressable onPress={openManage} style={styles.pillBtn}>
              <Text style={styles.pillBtnText}>Gerir</Text>
              <Ionicons name="chevron-forward" size={16} color="#1D4ED8" />
            </Pressable>
          </View>

          <View style={{ height: 12 }} />

          <View style={styles.limitsRow}>
            <LimitChip
              icon="home-outline"
              label="Imóveis"
              value={`${propertyCount} / ${propertyLimit}`}
            />
            <LimitChip
              icon="document-text-outline"
              label="Documentos"
              value={`${documentCount} / ${documentLimit}`}
            />
            <LimitChip
              icon="sparkles-outline"
              label="IA"
              value={currentPlanFromApi?.limits?.AiOnUpload ? "Ativa" : "—"}
              accent={currentPlanFromApi?.limits?.AiOnUpload}
            />
          </View>

          <View style={{ height: 14 }} />

          <Text style={styles.sectionLabel}>Uso</Text>
          <ProgressRow
            label={`Imóveis (${propertyCount}/${propertyLimit})`}
            pct={usagePctProps}
          />
          <ProgressRow
            label={`Documentos (${documentCount}/${documentLimit})`}
            pct={usagePctDocs}
          />

          {plansError ? (
            <Text style={styles.inlineError}>{plansError}</Text>
          ) : null}

          <View style={{ height: 12 }} />
          <Button
            title="Ver Planos"
            variant="gold"
            onPress={() => router.push("/profile/plans-help")}
          />
        </View>

        {/* Profile details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dados do perfil</Text>
          <Text style={styles.cardSubtitle}>Atualiza o teu nome e email.</Text>

          <View style={{ height: 12 }} />

          <Text style={styles.label}>Nome</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={(t) => {
              setName(t);
              if (alertMessage) setAlertMessage(null);
            }}
            placeholder="Nome completo"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              if (alertMessage) setAlertMessage(null);
            }}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={{ height: 10 }} />
          <Button title="Guardar Alterações" onPress={handleSave} />
        </View>

        {/* Quick Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ações rápidas</Text>
          <Text style={styles.cardSubtitle}>
            Atalhos úteis para o teu dia-a-dia.
          </Text>

          <View style={{ height: 12 }} />

          <ActionRow
            icon="add-circle-outline"
            title="Adicionar imóvel"
            subtitle="Cria um novo imóvel e começa a organizar"
            onPress={() => router.push("/properties/create")}
          />
          <ActionRow
            icon="cloud-upload-outline"
            title="Upload de documento"
            subtitle="Envia PDF/imagens para um imóvel"
            onPress={() => router.push("/documents/upload")}
          />
          <ActionRow
            icon="shield-checkmark-outline"
            title="Segurança"
            subtitle="Palavra-passe e proteção da conta"
            onPress={() => router.push("/security")}
          />
        </View>

        <Button
          variant="ghost"
          title="Voltar à página inicial"
          onPress={() => router.push("/")}
        />
      </ScrollView>

      {/* No-Modal overlay sheet (stable) */}
      <SubscriptionOverlaySheet
        open={subscriptionOpen}
        onClose={closeManage}
        plans={plans}
        loading={plansLoading}
        currentPlanCode={currentPlanCode}
        selectedPlanCode={selectedPlanCode}
        onSelectPlan={setSelectedPlanCode}
        onConfirm={handleConfirmPlanChange}
        onOpenBilling={() => router.push("/payments/payment")}
      />
    </SafeAreaView>
  );
}

/* ---------------------------- Small components ---------------------------- */

function LimitChip({
  icon,
  label,
  value,
  accent,
}: {
  icon: any;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <View style={[styles.chip, accent && styles.chipAccent]}>
      <Ionicons name={icon} size={16} color={accent ? "#047857" : "#2563EB"} />
      <View style={{ flex: 1 }}>
        <Text style={styles.chipLabel}>{label}</Text>
        <Text style={[styles.chipValue, accent && { color: "#047857" }]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function ProgressRow({ label, pct }: { label: string; pct: number }) {
  return (
    <View style={{ marginTop: 10 }}>
      <View style={styles.progressTop}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressPct}>{Math.round(pct * 100)}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[styles.progressFill, { width: `${Math.round(pct * 100)}%` }]}
        />
      </View>
    </View>
  );
}

function ActionRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: any;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.actionRow}>
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={18} color="#2563EB" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
    </Pressable>
  );
}

/* ---------------------- Subscription Overlay Sheet ---------------------- */

function SubscriptionOverlaySheet({
  open,
  onClose,
  plans,
  loading,
  currentPlanCode,
  selectedPlanCode,
  onSelectPlan,
  onConfirm,
  onOpenBilling,
}: {
  open: boolean;
  onClose: () => void;
  plans: SubscriptionPlanDto[];
  loading: boolean;
  currentPlanCode: string;
  selectedPlanCode: string;
  onSelectPlan: (code: string) => void;
  onConfirm: () => void;
  onOpenBilling: () => void;
}) {
  const currentNormalized = planCodeToId(currentPlanCode);
  const selectedNormalized = planCodeToId(selectedPlanCode);
  const selectedIsCurrent =
    selectedNormalized && selectedNormalized === currentNormalized;

  const showLoading = loading || plans.length === 0;

  if (!open) return null;

  return (
    <View style={sheet.root}>
      {/* Backdrop */}
      <Pressable style={sheet.backdrop} onPress={onClose} />

      {/* Sheet */}
      <View style={sheet.sheet}>
        <View style={sheet.grabber} />

        <View style={sheet.header}>
          <Text style={sheet.title}>Gerir subscrição</Text>
          <Pressable onPress={onClose} style={sheet.closeBtn}>
            <Text style={sheet.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        <Text style={sheet.subtitle}>
          Escolhe um plano e continua para o pagamento.
        </Text>

        {showLoading ? (
          <View style={sheet.loadingBox}>
            <ActivityIndicator />
            <Text style={sheet.loadingText}>A carregar planos…</Text>
          </View>
        ) : (
          <ScrollView
            style={{ maxHeight: 380 }}
            contentContainerStyle={{ paddingBottom: 10, gap: 10 }}
            showsVerticalScrollIndicator={false}
          >
            {plans.map((p) => {
              const isSelected = planCodeToId(p.code) === selectedNormalized;
              const isCurrent = planCodeToId(p.code) === currentNormalized;

              return (
                <Pressable
                  key={p.code}
                  onPress={() => onSelectPlan(p.code)}
                  style={[sheet.planCard, isSelected && sheet.planCardSelected]}
                >
                  <View style={sheet.planTop}>
                    <View style={{ flex: 1 }}>
                      <View style={sheet.planNameRow}>
                        <Text style={sheet.planName}>{p.name}</Text>

                        {p.isPopular ? (
                          <View style={sheet.badge}>
                            <Text style={sheet.badgeText}>Mais popular</Text>
                          </View>
                        ) : null}

                        {isCurrent ? (
                          <View style={sheet.currentPill}>
                            <Text style={sheet.currentPillText}>Atual</Text>
                          </View>
                        ) : null}
                      </View>

                      <Text style={sheet.planPrice}>{formatPrice(p)}</Text>

                      {p.description ? (
                        <Text style={sheet.planDesc}>{p.description}</Text>
                      ) : null}

                      <View style={sheet.metaRow}>
                        {typeof p.limits?.MaxProperties === "number" ? (
                          <Text style={sheet.metaText}>
                            Imóveis:{" "}
                            <Text style={sheet.metaStrong}>
                              {p.limits.MaxProperties}
                            </Text>
                          </Text>
                        ) : null}

                        {typeof p.limits?.MaxDocuments === "number" ? (
                          <>
                            <Text style={sheet.metaDot}>•</Text>
                            <Text style={sheet.metaText}>
                              Docs:{" "}
                              <Text style={sheet.metaStrong}>
                                {p.limits.MaxDocuments}
                              </Text>
                            </Text>
                          </>
                        ) : null}

                        {p.limits?.AiOnUpload ? (
                          <>
                            <Text style={sheet.metaDot}>•</Text>
                            <Text style={sheet.metaAi}>IA</Text>
                          </>
                        ) : null}
                      </View>
                    </View>

                    <View
                      style={[
                        sheet.radioOuter,
                        isSelected && sheet.radioOuterSelected,
                      ]}
                    >
                      {isSelected ? <View style={sheet.radioInner} /> : null}
                    </View>
                  </View>

                  <View style={{ height: 10 }} />

                  <View style={sheet.featureBlock}>
                    {p.features?.slice(0, 4).map((f) => (
                      <Text key={f} style={sheet.feature}>
                        ✓ {f}
                      </Text>
                    ))}
                    {p.excludedFeatures?.slice(0, 2).map((f) => (
                      <Text key={f} style={sheet.excluded}>
                        - {f}
                      </Text>
                    ))}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        <View style={sheet.actions}>
          <Pressable onPress={onOpenBilling} style={sheet.linkBtn}>
            <Text style={sheet.linkBtnText}>Gerir faturação</Text>
          </Pressable>

          <View style={{ height: 10 }} />

          <Pressable
            onPress={onConfirm}
            disabled={showLoading || !selectedPlanCode || selectedIsCurrent}
            style={[
              sheet.primaryBtn,
              (showLoading || !selectedPlanCode || selectedIsCurrent) &&
                sheet.primaryBtnDisabled,
            ]}
          >
            <Text style={sheet.primaryBtnText}>
              {selectedIsCurrent ? "Já estás neste plano" : "Continuar"}
            </Text>
          </Pressable>

          <Text style={sheet.footnote}>
            Ao continuar, vais para o ecrã de pagamento com o plano selecionado.
          </Text>
        </View>
      </View>
    </View>
  );
}

/* ------------------------------- Styles ------------------------------- */

const styles = StyleSheet.create({
  container: {
    padding: 18,
    paddingBottom: 28,
    backgroundColor: "#F8FAFC",
    gap: 14,
  },

  headerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#DBEAFE",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#1D4ED8",
    fontWeight: "900",
    fontSize: 16,
  },
  headerName: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },
  headerEmail: {
    marginTop: 2,
    fontSize: 12,
    color: "#64748B",
  },
  badgeRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  planBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  planBadgeText: {
    color: "#1D4ED8",
    fontWeight: "900",
    fontSize: 12,
  },
  popularBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  popularBadgeText: {
    color: "#047857",
    fontWeight: "900",
    fontSize: 12,
  },
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

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
  },
  cardSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748B",
    lineHeight: 16,
  },

  pillBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  pillBtnText: {
    color: "#1D4ED8",
    fontWeight: "900",
    fontSize: 12,
  },

  limitsRow: {
    flexDirection: "row",
    gap: 10,
  },
  chip: {
    flex: 1,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  chipAccent: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  chipLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "700",
  },
  chipValue: {
    marginTop: 2,
    fontSize: 13,
    color: "#0F172A",
    fontWeight: "900",
  },

  sectionLabel: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "800",
    marginBottom: 4,
  },

  progressTop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "700",
  },
  progressPct: {
    fontSize: 12,
    color: "#0F172A",
    fontWeight: "900",
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    marginTop: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#2563EB",
  },

  label: {
    fontSize: 12,
    fontWeight: "800",
    color: "#475569",
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#0F172A",
  },

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#0F172A",
  },
  actionSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: "#64748B",
    lineHeight: 16,
  },

  inlineError: {
    marginTop: 10,
    fontSize: 12,
    color: "#B91C1C",
    fontWeight: "700",
  },
});

/* ---------------------- Sheet Styles ---------------------- */
const sheet = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0B1220",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 22 : 16,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 10,
  },
  grabber: {
    alignSelf: "center",
    width: 48,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#E2E8F0",
    marginBottom: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  closeBtnText: {
    fontSize: 16,
    color: "#0F172A",
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 12,
    color: "#64748B",
    fontSize: 13,
    lineHeight: 18,
  },

  loadingBox: {
    paddingVertical: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "700",
  },

  planCard: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 14,
    backgroundColor: "#FFFFFF",
  },
  planCardSelected: {
    borderColor: "#2563EB",
    backgroundColor: "#F8FAFF",
  },
  planTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  planNameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  planName: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
  },
  planPrice: {
    marginTop: 2,
    fontSize: 13,
    color: "#0F172A",
    fontWeight: "900",
  },
  planDesc: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748B",
    lineHeight: 16,
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#DBEAFE",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#1D4ED8",
  },
  currentPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  currentPillText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#047857",
  },

  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  radioOuterSelected: {
    borderColor: "#2563EB",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#2563EB",
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  metaText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "800",
  },
  metaStrong: {
    color: "#0F172A",
    fontWeight: "900",
  },
  metaDot: {
    color: "#CBD5E1",
    fontWeight: "900",
  },
  metaAi: {
    fontSize: 12,
    color: "#2563EB",
    fontWeight: "900",
  },

  featureBlock: {
    gap: 6,
  },
  feature: {
    fontSize: 12,
    color: "#334155",
    fontWeight: "700",
    lineHeight: 16,
  },
  excluded: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "700",
    lineHeight: 16,
  },

  actions: {
    marginTop: 12,
  },
  linkBtn: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  linkBtnText: {
    color: "#0F172A",
    fontWeight: "900",
    fontSize: 12,
  },
  primaryBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnDisabled: {
    opacity: 0.55,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
  footnote: {
    marginTop: 10,
    fontSize: 11,
    color: "#94A3B8",
    lineHeight: 16,
  },
});
