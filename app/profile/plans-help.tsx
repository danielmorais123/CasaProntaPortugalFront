// app/(tabs)/profile/plans-help.tsx

import React, { useContext, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { getPlans, canUpdateToPlan } from "@/hooks/services/subscription";
import { PlanLimits, SubscriptionPlanDto } from "@/types/models";
import { useQuery } from "@tanstack/react-query";
import { AuthContext } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function formatPrice(plan: SubscriptionPlanDto) {
  if (plan.code === "enterprise") {
    const yearly = plan.priceYearly ?? 1500;
    return `A partir de ${yearly}€/ano`;
  }
  if (!plan.priceMonthly || plan.priceMonthly === 0) return "Grátis";
  return `${plan.priceMonthly.toString().replace(".", ",")}€/mês`;
}

function Pill({
  text,
  tone = "neutral",
  icon,
}: {
  text: string;
  tone?: "neutral" | "blue" | "gold";
  icon?: any;
}) {
  return (
    <View
      style={[
        styles.pill,
        tone === "blue" && styles.pillBlue,
        tone === "gold" && styles.pillGold,
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={14}
          color={
            tone === "blue"
              ? "#1D4ED8"
              : tone === "gold"
              ? "#92400E"
              : "#334155"
          }
        />
      ) : null}
      <Text
        style={[
          styles.pillText,
          tone === "blue" && styles.pillTextBlue,
          tone === "gold" && styles.pillTextGold,
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

function ErrorListCard({
  title = "Não foi possível continuar",
  errors,
  onClose,
}: {
  title?: string;
  errors: string[];
  onClose?: () => void;
}) {
  if (!errors?.length) return null;

  return (
    <View style={styles.errorCard}>
      <View style={styles.errorTopRow}>
        <View style={styles.errorIconWrap}>
          <Ionicons name="alert-circle" size={18} color="#B91C1C" />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.errorTitle}>{title}</Text>
          <Text style={styles.errorMeta}>
            {errors.length} {errors.length === 1 ? "problema" : "problemas"}
          </Text>
        </View>

        {onClose ? (
          <Pressable
            onPress={onClose}
            style={styles.errorCloseBtn}
            hitSlop={10}
          >
            <Ionicons name="close" size={18} color="#64748B" />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.errorList}>
        {errors.slice(0, 6).map((e, idx) => (
          <View key={`${idx}-${e}`} style={styles.errorRow}>
            <View style={styles.errorDot} />
            <Text style={styles.errorItem}>{e}</Text>
          </View>
        ))}

        {errors.length > 6 ? (
          <Text style={styles.errorMore}>+ {errors.length - 6} mais…</Text>
        ) : null}
      </View>
    </View>
  );
}

function Accordion({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  };

  return (
    <View style={styles.accordion}>
      <Pressable onPress={toggle} style={styles.accordionHeader}>
        <Text style={styles.accordionTitle}>{title}</Text>
        <View style={styles.accordionChevronWrap}>
          <Text style={styles.accordionChevron}>{open ? "–" : "+"}</Text>
        </View>
      </Pressable>
      {open ? <View style={styles.accordionBody}>{children}</View> : null}
    </View>
  );
}

function limitsLine(limits: PlanLimits) {
  const parts: string[] = [];

  if (limits.maxProperties != null)
    parts.push(`${limits.maxProperties} imóveis`);
  if (limits.maxDocuments != null)
    parts.push(`${limits.maxDocuments} documentos`);
  if (limits.maxGuests != null) parts.push(`${limits.maxGuests} convidados`);

  if (limits.maxBuildings != null) parts.push(`${limits.maxBuildings} prédios`);
  if (limits.maxUnitsPerBuilding != null)
    parts.push(`${limits.maxUnitsPerBuilding} frações/prédio`);

  if (parts.length === 0) return "Limites por contrato";
  return parts.join(" • ");
}

function planPersona(code: string) {
  switch (code) {
    case "free":
      return "Para experimentar e criar hábito.";
    case "starter":
      return "Para quem quer organização, aceitando trabalho manual.";
    case "pro":
      return "Para quem quer automação: IA no upload + alertas automáticos.";
    case "business":
      return "Para equipas pequenas que gerem muitos imóveis (sem prédios).";
    case "portfolio":
      return "Para gestão de prédios/condomínios com frações e docs de partes comuns.";
    case "enterprise":
      return "Para grandes grupos com contrato anual e necessidades avançadas.";
    default:
      return "";
  }
}

export default function PlansHelpScreen() {
  const { user } = useContext(AuthContext);
  const router = useRouter();
  const [actionErrors, setActionErrors] = React.useState<string[]>([]);

  const {
    data: plans = [],
    isLoading: plansLoading,
    error: plansError,
  } = useQuery({
    queryKey: ["plans"],
    queryFn: getPlans,
    staleTime: 1000 * 60 * 10,
    select: (data) => {
      const order = [
        "free",
        "starter",
        "pro",
        "business",
        "portfolio",
        "enterprise",
      ];
      return [...data].sort(
        (a, b) => order.indexOf(a.code) - order.indexOf(b.code)
      );
    },
  });

  const currentCode = user?.planCode ?? "free";

  const currentPlan = useMemo(
    () => plans.find((p) => p.code === currentCode),
    [plans, currentCode]
  );

  const showAiBadge = useMemo(() => {
    return currentPlan?.limits?.aiOnUpload ?? false;
  }, [currentPlan]);

  async function onSelectPlan(plan: SubscriptionPlanDto) {
    setActionErrors([]);

    const result = await canUpdateToPlan(plan.code);

    if (result.canUpdate) {
      router.push({
        pathname: "/payments/payment",
        params: { planCode: plan.code },
      });
    } else {
      setActionErrors(
        result.errors ?? ["Não é possível mudar para este plano."]
      );
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
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
            <Text style={styles.title}>Planos</Text>
            <Text style={styles.subtitle}>
              Escolhe o plano certo para limites, automação e partilhas.
            </Text>
          </View>

          <View style={styles.headerBadge}>
            <Ionicons
              name="shield-checkmark-outline"
              size={16}
              color="#1D4ED8"
            />
          </View>
        </View>

        <ErrorListCard
          errors={actionErrors}
          onClose={() => setActionErrors([])}
        />

        {/* Meta */}
        <View style={styles.metaRow}>
          <Pill
            text={`Plano atual: ${currentCode.toUpperCase()}`}
            tone="blue"
            icon="checkmark-circle-outline"
          />
          <Pill
            text={showAiBadge ? "IA no upload" : "Sem IA no upload"}
            tone={showAiBadge ? "gold" : "neutral"}
            icon={showAiBadge ? "sparkles-outline" : "remove-circle-outline"}
          />
        </View>

        {/* Current Plan Spotlight */}
        {currentPlan ? (
          <View style={styles.currentSpotlight}>
            <View style={styles.currentSpotlightTop}>
              <View style={styles.currentSpotlightIcon}>
                <Ionicons name="star-outline" size={18} color="#1D4ED8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.currentSpotlightTitle}>O teu plano</Text>
                <Text style={styles.currentSpotlightPlan}>
                  {currentPlan.name} • {formatPrice(currentPlan)}
                </Text>
              </View>
              <View style={styles.currentRibbon}>
                <Text style={styles.currentRibbonText}>PLANO ATUAL</Text>
              </View>
            </View>

            <Text style={styles.currentSpotlightSub}>
              Limites:{" "}
              <Text style={styles.strong}>
                {limitsLine(currentPlan.limits ?? {})}
              </Text>
            </Text>
          </View>
        ) : null}

        {/* Loading / Error */}
        {plansLoading ? (
          <View style={styles.banner}>
            <ActivityIndicator />
            <Text style={styles.bannerTitle}>A carregar planos…</Text>
          </View>
        ) : plansError ? (
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>
              Não foi possível carregar os planos
            </Text>
            <Text style={styles.bannerMessage}>
              Podes continuar a usar a app. Tenta novamente mais tarde.
            </Text>
          </View>
        ) : (
          plans.map((p) => {
            const isCurrent = p.code === currentCode;

            return (
              <View
                key={p.code}
                style={[
                  styles.card,
                  p.isPopular && styles.cardPopular,
                  isCurrent && styles.cardCurrent,
                ]}
              >
                {/* Ribbon for current */}
                {isCurrent ? (
                  <View style={styles.cardCornerRibbon}>
                    <Text style={styles.cardCornerRibbonText}>ATUAL</Text>
                  </View>
                ) : null}

                <View style={styles.cardTopRow}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text style={styles.cardTitle}>{p.name}</Text>

                      {p.isPopular ? (
                        <View style={styles.popularBadge}>
                          <Ionicons
                            name="sparkles-outline"
                            size={13}
                            color="#92400E"
                          />
                          <Text style={styles.popularBadgeText}>Popular</Text>
                        </View>
                      ) : null}

                      {p.limits?.aiOnUpload ? (
                        <View style={styles.aiBadge}>
                          <Ionicons
                            name="flash-outline"
                            size={13}
                            color="#1D4ED8"
                          />
                          <Text style={styles.aiBadgeText}>IA</Text>
                        </View>
                      ) : null}
                    </View>

                    <Text style={styles.cardPrice}>{formatPrice(p)}</Text>
                    <Text style={styles.cardDesc}>{p.description}</Text>
                  </View>

                  {isCurrent ? <Pill text="Ativo" tone="blue" /> : null}
                </View>

                <View style={styles.divider} />

                <Text style={styles.cardInfoLabel}>Para quem é</Text>
                <Text style={styles.cardInfo}>{planPersona(p.code)}</Text>

                <Text style={[styles.cardInfoLabel, { marginTop: 10 }]}>
                  Limites
                </Text>
                <Text style={styles.cardInfo}>
                  {limitsLine(p.limits ?? {})}
                </Text>

                <View style={{ marginTop: 12 }}>
                  <Text style={styles.cardInfoLabel}>Inclui</Text>
                  <View style={styles.featureList}>
                    {p.features.slice(0, 8).map((f, idx) => (
                      <View key={idx} style={styles.featureRow}>
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color="#16A34A"
                        />
                        <Text style={styles.featureText}>{f}</Text>
                      </View>
                    ))}
                  </View>

                  {p.excludedFeatures?.length ? (
                    <>
                      <Text style={[styles.cardInfoLabel, { marginTop: 10 }]}>
                        Não inclui
                      </Text>
                      <View style={styles.featureList}>
                        {p.excludedFeatures.slice(0, 6).map((f, idx) => (
                          <View key={idx} style={styles.featureRowMuted}>
                            <Ionicons
                              name="close-circle"
                              size={16}
                              color="#94A3B8"
                            />
                            <Text style={styles.featureTextMuted}>{f}</Text>
                          </View>
                        ))}
                      </View>
                    </>
                  ) : null}
                </View>

                <Pressable
                  onPress={() => onSelectPlan(p)}
                  disabled={isCurrent}
                  style={[
                    styles.cta,
                    isCurrent && styles.ctaDisabled,
                    !isCurrent && p.isPopular && styles.ctaPrimary,
                  ]}
                >
                  <Text
                    style={[
                      styles.ctaText,
                      isCurrent && styles.ctaTextDisabled,
                    ]}
                  >
                    {isCurrent ? "Plano atual" : "Escolher plano"}
                  </Text>
                </Pressable>

                {p.code === "business" ? (
                  <Text style={styles.note}>
                    Nota: o BUSINESS gere imóveis “soltos”. Para prédios com
                    frações e documentos de partes comuns, usa{" "}
                    <Text style={styles.noteStrong}>PORTFOLIO</Text>.
                  </Text>
                ) : null}

                {p.code === "portfolio" ? (
                  <Text style={styles.note}>
                    PORTFOLIO permite gerir{" "}
                    <Text style={styles.noteStrong}>
                      Prédio → Frações → Documentos
                    </Text>{" "}
                    e também documentos do condomínio (partes comuns).
                  </Text>
                ) : null}

                {p.limits?.aiOnUpload ? (
                  <Text style={styles.note}>
                    IA: analisa automaticamente os documentos{" "}
                    <Text style={styles.noteStrong}>no momento do upload</Text>.
                  </Text>
                ) : null}
              </View>
            );
          })
        )}

        <Text style={styles.sectionTitle}>Perguntas frequentes</Text>

        <Accordion title="O que significa “IA no upload”?">
          <Text style={styles.faqText}>
            A IA lê o documento quando fazes upload e tenta identificar o tipo
            de documento, extrair datas importantes e campos úteis.
          </Text>
        </Accordion>

        <Accordion title="O que quer dizer “fair use” de IA?">
          <Text style={styles.faqText}>
            IA incluída com uso razoável para evitar abusos (uploads massivos
            automáticos). No uso normal, não notas restrições.
          </Text>
        </Accordion>

        <Accordion title="Qual a diferença entre BUSINESS e PORTFOLIO?">
          <Text style={styles.faqText}>
            BUSINESS é para gerir muitos imóveis simples. PORTFOLIO é para gerir{" "}
            <Text style={styles.noteStrong}>prédios/condomínios</Text> com
            frações e documentos de partes comuns.
          </Text>
        </Accordion>

        <Accordion title="Posso mudar de plano depois?">
          <Text style={styles.faqText}>
            Sim. Podes fazer upgrade quando precisares de mais limites ou
            automação.
          </Text>
        </Accordion>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { padding: 16, paddingBottom: 28 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  title: { fontSize: 22, fontWeight: "900", color: "#0F172A" },
  subtitle: { fontSize: 13, color: "#64748B", marginTop: 4, lineHeight: 18 },

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

  metaRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
    flexWrap: "wrap",
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
  pillText: { fontSize: 12, color: "#334155", fontWeight: "800" },
  pillBlue: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },
  pillTextBlue: { color: "#1D4ED8" },
  pillGold: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },
  pillTextGold: { color: "#92400E" },

  currentSpotlight: {
    borderWidth: 1,
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  currentSpotlightTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  currentSpotlightIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: "#DBEAFE",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
  },
  currentSpotlightTitle: { fontSize: 12, fontWeight: "900", color: "#1D4ED8" },
  currentSpotlightPlan: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "900",
    color: "#0F172A",
  },
  currentRibbon: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#2563EB",
  },
  currentRibbonText: { fontSize: 11, fontWeight: "900", color: "#FFFFFF" },
  currentSpotlightSub: {
    marginTop: 10,
    fontSize: 12,
    color: "#334155",
    fontWeight: "700",
    lineHeight: 16,
  },
  strong: { fontWeight: "900", color: "#0F172A" },

  card: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    overflow: "hidden",
  },
  cardPopular: {
    borderColor: "#CBD5E1",
  },
  cardCurrent: {
    borderColor: "#2563EB",
    backgroundColor: "#F8FAFF",
  },
  cardCornerRibbon: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#2563EB",
  },
  cardCornerRibbonText: { fontSize: 11, fontWeight: "900", color: "#FFFFFF" },

  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  cardTitle: { fontSize: 16, fontWeight: "900", color: "#0F172A" },

  popularBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  popularBadgeText: { fontSize: 11, fontWeight: "900", color: "#92400E" },

  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  aiBadgeText: { fontSize: 11, fontWeight: "900", color: "#1D4ED8" },

  cardPrice: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A",
  },
  cardDesc: { marginTop: 6, fontSize: 13, color: "#475569", lineHeight: 18 },

  divider: { height: 1, backgroundColor: "#EEF2F7", marginVertical: 12 },

  cardInfoLabel: { fontSize: 12, fontWeight: "900", color: "#0F172A" },
  cardInfo: { marginTop: 4, fontSize: 13, color: "#475569", lineHeight: 18 },

  featureList: {
    marginTop: 8,
    gap: 6,
  },

  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingVertical: 2,
  },

  featureRowMuted: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingVertical: 2,
    opacity: 0.75,
  },

  featureText: {
    flex: 1,
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
    fontWeight: "600",
  },

  featureTextMuted: {
    flex: 1,
    fontSize: 13,
    color: "#94A3B8",
    lineHeight: 18,
    fontWeight: "600",
    textDecorationLine: "line-through",
  },

  cta: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#0F172A",
    alignItems: "center",
  },
  ctaPrimary: {
    backgroundColor: "#2563EB",
  },
  ctaText: { color: "#FFFFFF", fontWeight: "900" },
  ctaDisabled: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  ctaTextDisabled: { color: "#94A3B8" },

  note: {
    marginTop: 10,
    fontSize: 12,
    color: "#64748B",
    lineHeight: 18,
    fontWeight: "600",
  },
  noteStrong: { fontWeight: "900", color: "#0F172A" },

  banner: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bannerTitle: { fontWeight: "900", color: "#0F172A" },
  bannerMessage: { color: "#475569", lineHeight: 18 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    marginTop: 14,
    marginBottom: 10,
    color: "#0F172A",
  },

  accordion: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    backgroundColor: "#FFFFFF",
  },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  accordionTitle: {
    fontSize: 14,
    fontWeight: "900",
    flex: 1,
    paddingRight: 10,
    color: "#0F172A",
  },
  accordionChevronWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  accordionChevron: { fontSize: 18, fontWeight: "900", color: "#0F172A" },
  accordionBody: { marginTop: 10 },
  faqText: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
    fontWeight: "600",
  },

  // -------- Error List Card --------
  errorCard: {
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  errorTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  errorIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  errorTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#7F1D1D",
  },
  errorMeta: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "700",
    color: "#991B1B",
    opacity: 0.85,
  },
  errorCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  errorList: { marginTop: 10, gap: 8 },
  errorRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  errorDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: "#DC2626",
    marginTop: 6,
  },
  errorItem: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    color: "#991B1B",
    fontWeight: "700",
  },
  errorMore: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "800",
    color: "#7F1D1D",
    opacity: 0.9,
  },
});
