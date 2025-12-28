// ProfileScreen.tsx
import React, {
  useEffect,
  useMemo,
  useCallback,
  useRef,
  useState,
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
  Animated,
  Easing,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/Button";
import { Alert } from "@/components/Alert";
import { profileUserLoggedIn } from "@/hooks/services/auth";
import { useRouter } from "expo-router";
import { api } from "@/hooks/services/api";

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

async function getPlans(): Promise<SubscriptionPlanDto[]> {
  const res = await api.get("/subscriptions/plans");
  return res.data;
}

function formatPrice(plan: SubscriptionPlanDto) {
  const monthly = plan.priceMonthly ?? 0;
  const yearly = plan.priceYearly ?? 0;

  if (yearly > 0 && monthly === 0) return `${yearly}€/ano`;
  if (monthly === 0) return "Grátis";
  // 14.99 -> "14,99€ / mês" pt-PT-ish
  const s = String(monthly).replace(".", ",");
  return `${s}€ / mês`;
}

function planCodeToId(code?: string) {
  return (code ?? "").toLowerCase();
}

export default function ProfileScreen() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // info de subscrição do perfil (vindo do BE)
  const [planName, setPlanName] = useState("");
  const [maxProperties, setMaxProperties] = useState<number>(0);
  const [maxDocumentsPerProperty, setMaxDocumentsPerProperty] =
    useState<number>(0);

  const [alertMessage, setAlertMessage] = useState<{
    type: "success" | "destructive";
    message: string;
  } | null>(null);

  const [refreshing, setRefreshing] = useState(false);

  // Plans do endpoint
  const [plans, setPlans] = useState<SubscriptionPlanDto[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState<string | null>(null);

  // Bottom sheet state
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);
  const [selectedPlanCode, setSelectedPlanCode] = useState<string>("");

  const currentPlanCode = useMemo(() => {
    // tenta inferir pelo planName (FREE/PRO/STARTER etc).
    // se no teu profile já tens code, usa isso diretamente.
    const normalized = (planName ?? "").trim().toLowerCase();
    // mapeamento simples; ajusta se precisares
    if (normalized.includes("free")) return "free";
    if (normalized.includes("starter")) return "starter";
    if (normalized.includes("pro")) return "pro";
    if (normalized.includes("business")) return "business";
    if (normalized.includes("portfolio")) return "portfolio";
    if (normalized.includes("enterprise")) return "enterprise";
    return "";
  }, [planName]);

  const fetchProfile = useCallback(async () => {
    try {
      const res: any = await profileUserLoggedIn();
      setName(res.name || res.user?.name || "");
      setEmail(res.email || res.user?.email || "");

      // Ajusta aos teus campos reais:
      setPlanName(res.planName || res.subscription?.planName || "FREE");
      setMaxProperties(
        res.maxProperties ?? res.subscription?.maxProperties ?? 1
      );
      setMaxDocumentsPerProperty(
        res.maxDocumentsPerProperty ??
          res.subscription?.maxDocumentsPerProperty ??
          20
      );
    } catch {
      // opcional: alert
    }
  }, []);

  const fetchPlans = useCallback(async () => {
    try {
      setPlansLoading(true);
      setPlansError(null);
      const data = await getPlans();
      setPlans(data);
    } catch (e) {
      setPlansError("Não foi possível carregar os planos.");
    } finally {
      setPlansLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchPlans();
  }, [fetchProfile, fetchPlans]);

  useEffect(() => {
    // default selecionado = plano atual, senão o primeiro
    if (!selectedPlanCode) {
      if (currentPlanCode) setSelectedPlanCode(currentPlanCode);
      else if (plans?.[0]?.code) setSelectedPlanCode(plans[0].code);
    }
  }, [currentPlanCode, plans, selectedPlanCode]);

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
    // TODO: update profile endpoint
  };

  const openManage = () => setSubscriptionOpen(true);
  const closeManage = () => setSubscriptionOpen(false);

  const handleConfirmPlanChange = () => {
    closeManage();
    router.push({
      pathname: "/payments/payment",
      params: { planCode: selectedPlanCode }, // <-- use planCode here
    });
  };

  const currentPlanFromApi = useMemo(() => {
    const code = planCodeToId(currentPlanCode);
    return plans.find((p) => planCodeToId(p.code) === code);
  }, [plans, currentPlanCode]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {alertMessage && (
          <Alert
            variant={
              alertMessage.type === "success" ? "success" : "destructive"
            }
            title={alertMessage.message}
          />
        )}

        <View style={styles.form}>
          <Text style={styles.label}>Nome</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Nome completo"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Subscription Card */}
          <View style={styles.subscriptionCard}>
            <View style={styles.subscriptionTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.subscriptionTitle}>Subscrição</Text>

                <View style={styles.planRow}>
                  <Text style={styles.subscriptionInfo}>
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

                <Text style={styles.subscriptionDetail}>
                  Preço:{" "}
                  <Text style={styles.subscriptionDetailStrong}>
                    {currentPlanFromApi ? formatPrice(currentPlanFromApi) : "—"}
                  </Text>
                </Text>

                <Text style={styles.subscriptionDetail}>
                  Máx. Imóveis:{" "}
                  <Text style={styles.subscriptionDetailStrong}>
                    {maxProperties}
                  </Text>
                </Text>

                <Text style={styles.subscriptionDetail}>
                  Docs por Imóvel:{" "}
                  <Text style={styles.subscriptionDetailStrong}>
                    {maxDocumentsPerProperty}
                  </Text>
                </Text>

                {plansError ? (
                  <Text style={styles.inlineError}>{plansError}</Text>
                ) : null}
              </View>

              <Pressable onPress={openManage} style={styles.manageIconBtn}>
                <Text style={styles.manageIconBtnText}>⚙️</Text>
              </Pressable>
            </View>

            <View style={{ height: 12 }} />

            <Button title="Gerir Subscrição" onPress={openManage} />
            <Button
              variant="ghost"
              title="Gerir Pagamento"
              onPress={() =>
                router.push({
                  pathname: "/payments/payment",
                  params: { planCode: selectedPlanCode }, // send the selected plan code
                })
              }
            />
          </View>

          <Button title="Guardar Alterações" onPress={handleSave} />
          <Button
            variant="ghost"
            title="Voltar à página inicial"
            onPress={() => router.push("/")}
          />
        </View>
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
  const translateY = useRef(new Animated.Value(520)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) {
      Animated.parallel([
        Animated.timing(backdrop, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdrop, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 520,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [open, backdrop, translateY]);

  const currentNormalized = planCodeToId(currentPlanCode);
  const selectedNormalized = planCodeToId(selectedPlanCode);
  const selectedIsCurrent =
    selectedNormalized && selectedNormalized === currentNormalized;
  console.log(plans);
  return (
    <Modal
      visible={open}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[sheetStyles.backdrop, { opacity: backdrop }]}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[sheetStyles.sheet, { transform: [{ translateY }] }]}
      >
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
            showsVerticalScrollIndicator={false}
          >
            {plans.map((p, planIndex) => {
              const isSelected = planCodeToId(p.code) === selectedNormalized;
              const isCurrent = planCodeToId(p.code) === currentNormalized;
              console.log("code", p.code);
              return (
                <Pressable
                  key={`plan-${planIndex}-${p.code}`}
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
                        key={`plan-${planIndex}-feature-${i}-${f}`}
                        style={sheetStyles.feature}
                      >
                        ✓ {f}
                      </Text>
                    ))}
                    {p.excludedFeatures?.slice(0, 3).map((f, i) => (
                      <Text
                        key={`plan-${planIndex}-excluded-${i}-${f}`}
                        style={sheetStyles.excluded}
                      >
                        – {f}
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
            disabled={loading || !selectedPlanCode || selectedIsCurrent}
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
            Ao continuar, vais para o ecrã de pagamento com o plano selecionado.
          </Text>
        </View>
      </Animated.View>
    </Modal>
  );
}

/* ------------------------------- Styles ------------------------------- */

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#F8FAFC",
  },
  form: {
    marginBottom: 30,
    display: "flex",
    gap: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#475569",
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#0F172A",
  },

  subscriptionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    marginVertical: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  subscriptionTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  subscriptionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
    color: "#2563EB",
  },
  planRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 6,
  },
  subscriptionInfo: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  subscriptionDetail: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 2,
  },
  subscriptionDetailStrong: {
    color: "#0F172A",
    fontWeight: "800",
  },
  currentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#047857",
  },
  popularBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#DBEAFE",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  popularBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#1D4ED8",
  },
  manageIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  manageIconBtnText: {
    fontSize: 16,
  },
  inlineError: {
    marginTop: 8,
    fontSize: 12,
    color: "#B91C1C",
    fontWeight: "600",
  },
});

const sheetStyles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0B1220",
  },
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
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
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
    fontWeight: "600",
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
    fontWeight: "800",
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
    fontWeight: "700",
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
    fontWeight: "600",
    lineHeight: 16,
  },
  excluded: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "600",
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
  },
  linkBtnText: {
    color: "#0F172A",
    fontWeight: "800",
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
