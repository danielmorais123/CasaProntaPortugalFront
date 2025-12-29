// ProfileScreen.tsx
import React, {
  useEffect,
  useMemo,
  useCallback,
  useState,
  useContext,
} from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Modal,
  Pressable,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/Button";
import { Alert } from "@/components/Alert";
import { profileUserLoggedIn } from "@/hooks/services/auth";
import { useRouter } from "expo-router";
import { getPlans } from "@/hooks/services/subscription";
import { AuthContext } from "@/context/AuthContext";

type PlanLimits = {
  MaxProperties?: number;
  MaxDocuments?: number;
  MaxGuests?: number;
  MaxBuildings?: number;
  MaxUnitsPerBuilding?: number;
  AiOnUpload?: boolean;
};

type SubscriptionPlanDto = {
  code: string;
  name: string;
  priceMonthly?: number;
  priceYearly?: number;
  isPopular: boolean;
  description?: string;
  limits?: PlanLimits;
  features: string[];
  excludedFeatures?: string[];
};

function formatPrice(plan: SubscriptionPlanDto) {
  const monthly = plan.priceMonthly ?? 0;
  const yearly = plan.priceYearly ?? 0;

  if (yearly > 0 && monthly === 0) return `${yearly}€/ano`;
  if (monthly === 0) return "Grátis";
  const s = String(monthly).replace(".", ",");
  return `${s}€ / mês`;
}

function planCodeToId(code?: string) {
  return (code ?? "").toLowerCase();
}

function Pill({ text }: { text: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>{text}</Text>
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

export default function ProfileScreen() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [planName, setPlanName] = useState("");
  const [maxProperties, setMaxProperties] = useState<number>(0);
  const [maxDocumentsPerProperty, setMaxDocumentsPerProperty] =
    useState<number>(0);

  const [alertMessage, setAlertMessage] = useState<{
    type: "success" | "destructive";
    message: string;
  } | null>(null);

  const [refreshing, setRefreshing] = useState(false);

  const [plans, setPlans] = useState<SubscriptionPlanDto[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState<string | null>(null);

  const [subscriptionOpen, setSubscriptionOpen] = useState(false);
  const [selectedPlanCode, setSelectedPlanCode] = useState<string>("");

  const [screenLoading, setScreenLoading] = useState(true);

  const { logout } = useContext(AuthContext);
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

  const fetchProfile = useCallback(async () => {
    const res: any = await profileUserLoggedIn();
    setName(res.name || res.user?.name || "");
    setEmail(res.email || res.user?.email || "");

    setPlanName(res.planName || res.subscription?.planName || "FREE");
    setMaxProperties(res.maxProperties ?? res.subscription?.maxProperties ?? 1);
    setMaxDocumentsPerProperty(
      res.maxDocumentsPerProperty ??
        res.subscription?.maxDocumentsPerProperty ??
        20
    );
  }, []);

  const fetchPlans = useCallback(async () => {
    setPlansLoading(true);
    setPlansError(null);
    try {
      const data = await getPlans();
      setPlans(data);
    } catch {
      setPlansError("Não foi possível carregar os planos.");
    } finally {
      setPlansLoading(false);
    }
  }, []);

  const boot = useCallback(async () => {
    setScreenLoading(true);
    try {
      await Promise.all([fetchProfile(), fetchPlans()]);
    } finally {
      setScreenLoading(false);
    }
  }, [fetchProfile, fetchPlans]);

  useEffect(() => {
    boot();
  }, [boot]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchProfile(), fetchPlans()]);
    setRefreshing(false);
  }, [fetchProfile, fetchPlans]);

  const handleSave = () => {
    setAlertMessage({
      type: "success",
      message: "Perfil atualizado com sucesso!",
    });
    // TODO: call update profile endpoint
  };

  const openManage = () => {
    if (currentPlanCode) setSelectedPlanCode(currentPlanCode);
    else if (plans?.[0]?.code) setSelectedPlanCode(plans[0].code);
    setSubscriptionOpen(true);
  };

  const closeManage = () => setSubscriptionOpen(false);

  const handleConfirmPlanChange = () => {
    closeManage();
    router.push({
      pathname: "/payments/payment",
      params: { planCode: selectedPlanCode },
    });
  };

  const aiEnabled = currentPlanFromApi?.limits?.AiOnUpload ?? false;

  if (screenLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>A carregar perfil…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.leftHeader}>
            <Pressable
              style={styles.iconBtn}
              onPress={() => router.back()}
              hitSlop={10}
            >
              <Ionicons name="arrow-back" size={18} />
            </Pressable>

            <View style={styles.avatar}>
              <Ionicons name="person" size={18} />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerName} numberOfLines={1}>
              {name || "Conta"}
            </Text>
            <Text style={styles.headerEmail} numberOfLines={1}>
              {email || "—"}
            </Text>

            <View style={styles.headerPills}>
              <Pill
                text={`Plano: ${(
                  currentPlanFromApi?.name ??
                  planName ??
                  "FREE"
                ).toUpperCase()}`}
              />
              <Pill text={aiEnabled ? "IA no upload" : "Sem IA"} />
            </View>
          </View>

          <Pressable
            style={styles.iconBtn}
            onPress={() => router.push("/profile/plans-help")}
            hitSlop={10}
          >
            <Ionicons name="card-outline" size={18} />
          </Pressable>
        </View>

        {alertMessage ? (
          <Alert
            variant={
              alertMessage.type === "success" ? "success" : "destructive"
            }
            title={alertMessage.message}
          />
        ) : null}

        {/* Conta */}
        <SectionHeader title="Conta" />
        <View style={styles.card}>
          <Text style={styles.label}>Nome</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Nome completo"
          />

          <Text style={[styles.label, { marginTop: 10 }]}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={{ height: 12 }} />
          <Button title="Guardar alterações" onPress={handleSave} />
        </View>

        {/* Subscrição */}
        <SectionHeader title="Subscrição" />
        <View style={styles.card}>
          <View style={styles.subTopRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.planRow}>
                <Text style={styles.planName}>
                  {currentPlanFromApi?.name ?? planName ?? "—"}
                </Text>

                <View style={styles.currentBadge}>
                  <Text style={styles.currentBadgeText}>ATUAL</Text>
                </View>

                {currentPlanFromApi?.isPopular ? (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>POPULAR</Text>
                  </View>
                ) : null}
              </View>

              <Text style={styles.metaLine}>
                Preço:{" "}
                <Text style={styles.metaStrong}>
                  {currentPlanFromApi ? formatPrice(currentPlanFromApi) : "—"}
                </Text>
              </Text>

              <Text style={styles.metaLine}>
                Máx. imóveis:{" "}
                <Text style={styles.metaStrong}>{maxProperties}</Text>
              </Text>

              <Text style={styles.metaLine}>
                Documentos/Imóvel:{" "}
                <Text style={styles.metaStrong}>{maxDocumentsPerProperty}</Text>
              </Text>

              {plansError ? (
                <Text style={styles.inlineError}>{plansError}</Text>
              ) : null}
            </View>

            <Pressable onPress={openManage} style={styles.iconBtn} hitSlop={10}>
              <Ionicons name="settings-outline" size={18} />
            </Pressable>
          </View>

          <View style={{ height: 12 }} />
          <Button title="Gerir subscrição" onPress={openManage} />
          <Button
            variant="ghost"
            title="Gerir pagamento"
            onPress={() =>
              router.push({
                pathname: "/payments/payment",
                params: { planCode: selectedPlanCode },
              })
            }
          />
        </View>

        {/* Ações rápidas */}
        <SectionHeader title="Ações" />
        <View style={styles.card}>
          <Pressable
            style={styles.actionRow}
            onPress={() => router.push("/property/about")}
          >
            <Ionicons name="help-circle-outline" size={18} />
            <Text style={styles.actionText}>Como funciona (imóveis)</Text>
            <Text style={styles.actionChevron}>›</Text>
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={styles.actionRow}
            onPress={() => router.push("/profile/plans-help")}
          >
            <Ionicons name="card-outline" size={18} />
            <Text style={styles.actionText}>Planos</Text>
            <Text style={styles.actionChevron}>›</Text>
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={styles.actionRow}
            onPress={() => router.push("/notifications")}
          >
            <Ionicons name="notifications-outline" size={18} />
            <Text style={styles.actionText}>Alertas</Text>
            <Text style={styles.actionChevron}>›</Text>
          </Pressable>
        </View>

        {/* Logout */}
        <SectionHeader title="Sessão" />
        <View style={styles.card}>
          <Button title="Terminar sessão" onPress={() => {}} />
          {/* ^^^ Se o teu Button não suporta onPress simples aqui, troca por Pressable e chama logout */}
          <Pressable style={styles.logoutRow} onPress={() => logout()}>
            <Ionicons name="log-out-outline" size={18} />
            <Text style={styles.logoutRowText}>Sair</Text>
          </Pressable>
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>

      <SubscriptionSheet
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

/* ---------------------------- Bottom Sheet ---------------------------- */
/* Mantive o teu SubscriptionSheet praticamente igual, só re-aproveito daqui. */

function SubscriptionSheet({
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

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={sheetStyles.modalRoot}>
        <View style={sheetStyles.backdrop}>
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </View>

        <View style={sheetStyles.sheet}>
          <View style={sheetStyles.grabber} />

          <View style={sheetStyles.header}>
            <Text style={sheetStyles.title}>Gerir subscrição</Text>
            <Pressable onPress={onClose} style={sheetStyles.closeBtn}>
              <Text style={sheetStyles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <Text style={sheetStyles.subtitle}>
            Escolhe um plano. A finalização do pagamento é feita no ecrã de
            faturação.
          </Text>

          {loading ? (
            <View style={sheetStyles.loadingBox}>
              <ActivityIndicator />
              <Text style={sheetStyles.loadingText}>A carregar planos…</Text>
            </View>
          ) : (
            <ScrollView
              style={{ maxHeight: 360 }}
              contentContainerStyle={{ paddingBottom: 10, gap: 10 }}
            >
              {plans.map((p, idx) => {
                const isSelected = planCodeToId(p.code) === selectedNormalized;
                const isCurrent = planCodeToId(p.code) === currentNormalized;

                return (
                  <Pressable
                    key={`plan-${idx}-${p.code}`}
                    onPress={() => onSelectPlan(p.code)}
                    style={[
                      sheetStyles.planCard,
                      isSelected && sheetStyles.planCardSelected,
                    ]}
                  >
                    <View style={sheetStyles.planTop}>
                      <View style={{ flex: 1 }}>
                        <View style={sheetStyles.planNameRow}>
                          <Text style={sheetStyles.planName}>{p.name}</Text>

                          {p.isPopular ? (
                            <View style={sheetStyles.badge}>
                              <Text style={sheetStyles.badgeText}>
                                Mais popular
                              </Text>
                            </View>
                          ) : null}

                          {isCurrent ? (
                            <View style={sheetStyles.currentPill}>
                              <Text style={sheetStyles.currentPillText}>
                                Atual
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        <Text style={sheetStyles.planPrice}>
                          {formatPrice(p)}
                        </Text>
                        {p.description ? (
                          <Text style={sheetStyles.planDesc}>
                            {p.description}
                          </Text>
                        ) : null}
                      </View>

                      <View
                        style={[
                          sheetStyles.radioOuter,
                          isSelected && sheetStyles.radioOuterSelected,
                        ]}
                      >
                        {isSelected ? (
                          <View style={sheetStyles.radioInner} />
                        ) : null}
                      </View>
                    </View>

                    <View style={sheetStyles.metaRow}>
                      {typeof p.limits?.MaxProperties === "number" ? (
                        <Text style={sheetStyles.metaText}>
                          Imóveis:{" "}
                          <Text style={sheetStyles.metaStrong}>
                            {p.limits.MaxProperties}
                          </Text>
                        </Text>
                      ) : null}

                      {typeof p.limits?.MaxDocuments === "number" ? (
                        <>
                          <Text style={sheetStyles.metaDot}>•</Text>
                          <Text style={sheetStyles.metaText}>
                            Documentos:{" "}
                            <Text style={sheetStyles.metaStrong}>
                              {p.limits.MaxDocuments}
                            </Text>
                          </Text>
                        </>
                      ) : null}

                      {p.limits?.AiOnUpload ? (
                        <>
                          <Text style={sheetStyles.metaDot}>•</Text>
                          <Text style={sheetStyles.metaAi}>IA</Text>
                        </>
                      ) : null}
                    </View>

                    <View style={{ height: 10 }} />

                    <View style={sheetStyles.featureBlock}>
                      {p.features?.slice(0, 4).map((f, i) => (
                        <Text
                          key={`plan-${idx}-f-${i}`}
                          style={sheetStyles.feature}
                        >
                          ✓ {f}
                        </Text>
                      ))}
                      {p.excludedFeatures?.slice(0, 3).map((f, i) => (
                        <Text
                          key={`plan-${idx}-x-${i}`}
                          style={sheetStyles.excluded}
                        >
                          - {f}
                        </Text>
                      ))}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          <View style={sheetStyles.actions}>
            <Pressable onPress={onOpenBilling} style={sheetStyles.linkBtn}>
              <Text style={sheetStyles.linkBtnText}>Gerir faturação</Text>
            </Pressable>

            <View style={{ height: 10 }} />

            <Pressable
              onPress={onConfirm}
              disabled={
                loading ||
                !Boolean(selectedPlanCode) ||
                Boolean(selectedIsCurrent)
              }
              style={[
                sheetStyles.primaryBtn,
                (loading || !selectedPlanCode || selectedIsCurrent) &&
                  sheetStyles.primaryBtnDisabled,
              ]}
            >
              <Text style={sheetStyles.primaryBtnText}>
                {selectedIsCurrent ? "Já estás neste plano" : "Continuar"}
              </Text>
            </Pressable>

            <Text style={sheetStyles.footnote}>
              Ao continuar, vais para o ecrã de pagamento com o plano
              selecionado.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ------------------------------- Styles ------------------------------- */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 16, paddingBottom: 24 },

  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  loadingText: { color: "#666", fontWeight: "800" },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  leftHeader: {
    flexDirection: "column",
    gap: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  headerName: { fontSize: 18, fontWeight: "900" },
  headerEmail: { marginTop: 2, fontSize: 12, color: "#666", fontWeight: "700" },
  headerPills: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    flexWrap: "wrap",
  },

  pill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#F2F2F2",
  },
  pillText: { fontSize: 12, fontWeight: "800", color: "#111" },

  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
  },

  sectionTitle: {
    marginTop: 14,
    marginBottom: 10,
    fontSize: 16,
    fontWeight: "900",
  },

  card: {
    borderWidth: 1,
    borderColor: "#EAEAEA",
    borderRadius: 16,
    padding: 14,
    backgroundColor: "#fff",
  },

  label: { fontSize: 12, fontWeight: "900", color: "#111", marginBottom: 6 },
  input: {
    backgroundColor: "#F7F7F7",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111",
  },

  subTopRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },

  planRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 6,
  },
  planName: { fontSize: 16, fontWeight: "900", color: "#111" },

  currentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  currentBadgeText: { fontSize: 11, fontWeight: "900", color: "#047857" },

  popularBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#DBEAFE",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  popularBadgeText: { fontSize: 11, fontWeight: "900", color: "#1D4ED8" },

  metaLine: { fontSize: 13, color: "#666", marginBottom: 2, lineHeight: 18 },
  metaStrong: { color: "#111", fontWeight: "900" },

  inlineError: {
    marginTop: 8,
    fontSize: 12,
    color: "#B91C1C",
    fontWeight: "800",
  },

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },
  actionText: { flex: 1, fontSize: 13, fontWeight: "900", color: "#111" },
  actionChevron: { fontSize: 18, fontWeight: "900", color: "#999" },
  divider: { height: 1, backgroundColor: "#F0F0F0" },

  logoutRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#111",
    justifyContent: "center",
  },
  logoutRowText: { color: "#fff", fontWeight: "900" },
});

const sheetStyles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0B1220",
    opacity: 0.6,
  },
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
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
  title: { fontSize: 18, fontWeight: "900", color: "#111" },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F2F2F2",
  },
  closeBtnText: { fontSize: 16, color: "#111" },
  subtitle: {
    marginTop: 6,
    marginBottom: 12,
    color: "#666",
    fontSize: 13,
    lineHeight: 18,
  },

  loadingBox: {
    paddingVertical: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    gap: 10,
  },
  loadingText: { fontSize: 12, color: "#666", fontWeight: "800" },

  planCard: {
    borderWidth: 1,
    borderColor: "#EAEAEA",
    borderRadius: 16,
    padding: 14,
    backgroundColor: "#FFFFFF",
  },
  planCardSelected: { borderColor: "#111", backgroundColor: "#FAFAFA" },
  planTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },

  planNameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  planName: { fontSize: 15, fontWeight: "900", color: "#111" },
  planPrice: { marginTop: 2, fontSize: 13, color: "#111", fontWeight: "900" },
  planDesc: { marginTop: 4, fontSize: 12, color: "#666", lineHeight: 16 },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#DBEAFE",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  badgeText: { fontSize: 11, fontWeight: "900", color: "#1D4ED8" },
  currentPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  currentPillText: { fontSize: 11, fontWeight: "900", color: "#047857" },

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
  radioOuterSelected: { borderColor: "#111" },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#111",
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  metaText: { fontSize: 12, color: "#666", fontWeight: "800" },
  metaStrong: { color: "#111", fontWeight: "900" },
  metaDot: { color: "#CBD5E1", fontWeight: "900" },
  metaAi: { fontSize: 12, color: "#111", fontWeight: "900" },

  featureBlock: { gap: 6 },
  feature: { fontSize: 12, color: "#333", fontWeight: "700", lineHeight: 16 },
  excluded: { fontSize: 12, color: "#999", fontWeight: "700", lineHeight: 16 },

  actions: { marginTop: 12 },
  linkBtn: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#F2F2F2",
  },
  linkBtnText: { color: "#111", fontWeight: "900", fontSize: 12 },
  primaryBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnDisabled: { opacity: 0.55 },
  primaryBtnText: { color: "#FFFFFF", fontWeight: "900" },
  footnote: { marginTop: 10, fontSize: 11, color: "#999", lineHeight: 16 },
});
