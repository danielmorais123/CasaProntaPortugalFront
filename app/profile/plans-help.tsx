// app/(tabs)/profile/plans-help.tsx (exemplo)
// adapta path conforme o teu Expo Router

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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { getPlans } from "@/hooks/services/subscription";
import { PlanLimits, SubscriptionPlanDto } from "@/types/models";
import { useQuery } from "@tanstack/react-query";
import { AuthContext } from "@/context/AuthContext";

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

function Pill({ text }: { text: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>{text}</Text>
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
        <Text style={styles.accordionChevron}>{open ? "-" : "+"}</Text>
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

  // React Query for plans
  const {
    data: plans = [],
    isLoading: plansLoading,
    error: plansError,
  } = useQuery({
    queryKey: ["plans"],
    queryFn: getPlans,
    staleTime: 1000 * 60 * 10,
    select: (data) => {
      // Ordena numa ordem fixa
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

  const showAiBadge = useMemo(() => {
    const plan = plans?.find((p) => p.code === currentCode);
    return plan?.limits?.aiOnUpload ?? false;
  }, [plans, currentCode]);

  function onSelectPlan(plan: SubscriptionPlanDto) {
    if (plan.code === "enterprise") {
      router.push("/profile/plans-help");
      return;
    }
    router.push({
      pathname: "/payments/payment",
      params: { planCode: plan.code },
    });
    // router.push(`/profile/subscribe?plan=${plan.code}`);
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Planos</Text>
        <Text style={styles.subtitle}>
          Escolhe o plano certo para os teus limites, automação e partilhas.
        </Text>

        <View style={styles.metaRow}>
          <Pill text={`Plano atual: ${currentCode.toUpperCase()}`} />
          <Pill text={showAiBadge ? "IA no upload" : "Sem IA no upload"} />
        </View>

        {plansLoading ? (
          <View style={styles.banner}>
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
                <View style={styles.cardTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>
                      {p.name}
                      {p.isPopular ? (
                        <Text style={styles.popular}> ⭐ Popular</Text>
                      ) : null}
                    </Text>
                    <Text style={styles.cardPrice}>{formatPrice(p)}</Text>
                    <Text style={styles.cardDesc}>{p.description}</Text>
                  </View>

                  {isCurrent ? <Pill text="Ativo" /> : null}
                </View>

                <View style={styles.divider} />

                <Text style={styles.cardInfoLabel}>Para quem é</Text>
                <Text style={styles.cardInfo}>{planPersona(p.code)}</Text>

                <Text style={styles.cardInfoLabel}>Limites</Text>
                <Text style={styles.cardInfo}>
                  {limitsLine(p.limits ?? {})}
                </Text>

                <View style={{ marginTop: 10 }}>
                  <Text style={styles.cardInfoLabel}>Inclui</Text>
                  <View style={styles.bullets}>
                    {p.features.slice(0, 8).map((f, idx) => (
                      <Text key={idx} style={styles.bullet}>
                        • {f}
                      </Text>
                    ))}
                  </View>

                  {p.excludedFeatures?.length ? (
                    <>
                      <Text style={[styles.cardInfoLabel, { marginTop: 10 }]}>
                        Não inclui
                      </Text>
                      <View style={styles.bullets}>
                        {p.excludedFeatures.slice(0, 6).map((f, idx) => (
                          <Text key={idx} style={styles.bulletMuted}>
                            • {f}
                          </Text>
                        ))}
                      </View>
                    </>
                  ) : null}
                </View>

                <Pressable
                  onPress={() => onSelectPlan(p)}
                  disabled={isCurrent}
                  style={[styles.cta, isCurrent && styles.ctaDisabled]}
                >
                  <Text
                    style={[
                      styles.ctaText,
                      isCurrent && styles.ctaTextDisabled,
                    ]}
                  >
                    {isCurrent
                      ? "Plano atual"
                      : p.code === "enterprise"
                      ? "Falar connosco"
                      : "Escolher plano"}
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
            de documento, extrair datas importantes e campos úteis (por exemplo,
            validade, número, entidade emissora). Não é um “chat”.
          </Text>
        </Accordion>

        <Accordion title="O que quer dizer “fair use” de IA?">
          <Text style={styles.faqText}>
            Quer dizer que a IA está incluída, mas com uso razoável para evitar
            abusos (ex.: uploads massivos automáticos). Na prática, se o padrão
            de uso for normal, não vais notar restrições.
          </Text>
        </Accordion>

        <Accordion title="Qual a diferença entre BUSINESS e PORTFOLIO?">
          <Text style={styles.faqText}>
            BUSINESS é para gerir muitos imóveis (casa/apartamento/terreno) de
            forma simples. PORTFOLIO é para gerir{" "}
            <Text style={styles.noteStrong}>prédios/condomínios</Text> com
            frações e documentos de partes comuns.
          </Text>
        </Accordion>

        <Accordion title="Posso mudar de plano depois?">
          <Text style={styles.faqText}>
            Sim. Podes fazer upgrade quando precisares de mais limites ou
            automação. (Quando ligares ao Stripe, o fluxo fica automático.)
          </Text>
        </Accordion>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 16, paddingBottom: 28 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 6 },
  subtitle: { fontSize: 14, color: "#444", marginBottom: 12, lineHeight: 20 },

  metaRow: { flexDirection: "row", gap: 8, marginBottom: 12, flexWrap: "wrap" },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#F2F2F2",
  },
  pillText: { fontSize: 12, color: "#333", fontWeight: "700" },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginTop: 14,
    marginBottom: 10,
  },

  card: {
    borderWidth: 1,
    borderColor: "#E6E6E6",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  cardPopular: {
    borderColor: "#111",
  },
  cardCurrent: {
    backgroundColor: "#FAFAFA",
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: "900" },
  popular: { fontSize: 12, fontWeight: "900" },
  cardPrice: { marginTop: 6, fontSize: 14, fontWeight: "900" },
  cardDesc: { marginTop: 6, fontSize: 13, color: "#444", lineHeight: 18 },

  divider: { height: 1, backgroundColor: "#EFEFEF", marginVertical: 12 },

  cardInfoLabel: { fontSize: 12, fontWeight: "900", color: "#111" },
  cardInfo: { marginTop: 4, fontSize: 13, color: "#444", lineHeight: 18 },

  bullets: { marginTop: 6 },
  bullet: { fontSize: 13, color: "#444", lineHeight: 18, marginBottom: 4 },
  bulletMuted: { fontSize: 13, color: "#777", lineHeight: 18, marginBottom: 4 },

  cta: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#111",
    alignItems: "center",
  },
  ctaText: { color: "#fff", fontWeight: "900" },
  ctaDisabled: { backgroundColor: "#EAEAEA" },
  ctaTextDisabled: { color: "#999" },

  note: { marginTop: 10, fontSize: 12, color: "#555", lineHeight: 18 },
  noteStrong: { fontWeight: "900", color: "#111" },

  banner: {
    borderWidth: 1,
    borderColor: "#E6E6E6",
    backgroundColor: "#FAFAFA",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  bannerTitle: { fontWeight: "900", marginBottom: 4, color: "#111" },
  bannerMessage: { color: "#444", lineHeight: 18 },

  accordion: {
    borderWidth: 1,
    borderColor: "#E6E6E6",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  accordionTitle: {
    fontSize: 14,
    fontWeight: "900",
    flex: 1,
    paddingRight: 10,
  },
  accordionChevron: { fontSize: 18, fontWeight: "900" },
  accordionBody: { marginTop: 10 },
  faqText: { fontSize: 13, color: "#444", lineHeight: 18 },
});
