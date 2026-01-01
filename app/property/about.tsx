// app/(tabs)/properties/create-help.tsx

import React, { useMemo, useState, useContext } from "react";
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
import { useQuery } from "@tanstack/react-query";
import { AuthContext } from "@/context/AuthContext";
import { getPlans } from "@/hooks/services/subscription";
import { Ionicons } from "@expo/vector-icons";

type PropertyTypeKey = "House" | "Apartment" | "Land" | "Building";
type PropertyCard = {
  key: PropertyTypeKey;
  title: string;
  emoji: string;
  whenToUse: string;
  whatYouManage: string;
  docs: string[];
  cta: string;
  route: string;
  requiresPlanCode?: "portfolio";
};

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function Pill({
  text,
  tone = "neutral",
  icon,
}: {
  text: string;
  tone?: "neutral" | "blue" | "muted";
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View
      style={[
        styles.pill,
        tone === "blue" && styles.pillBlue,
        tone === "muted" && styles.pillMuted,
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={14}
          color={tone === "blue" ? "#1D4ED8" : "#64748B"}
        />
      ) : null}
      <Text
        style={[
          styles.pillText,
          tone === "blue" && styles.pillTextBlue,
          tone === "muted" && styles.pillTextMuted,
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

/**
 * ✅ KEEP THIS EXACT "Requer Portfolio" styling (only this)
 * (the user asked to keep the golden banner as-is)
 */
function InlineBanner({
  title,
  message,
  actionText,
  onAction,
}: {
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.banner}>
      <Text style={styles.bannerTitle}>{title}</Text>
      <Text style={styles.bannerMessage}>{message}</Text>
      {actionText && onAction ? (
        <Pressable onPress={onAction} style={styles.bannerButton}>
          <Text style={styles.bannerButtonText}>{actionText}</Text>
        </Pressable>
      ) : null}
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
  const [open, setOpen] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  };

  return (
    <View style={styles.accordion}>
      <Pressable onPress={toggle} style={styles.accordionHeader} hitSlop={8}>
        <Text style={styles.accordionTitle}>{title}</Text>
        <View style={styles.accordionChevronWrap}>
          <Text style={styles.accordionChevron}>{open ? "-" : "+"}</Text>
        </View>
      </Pressable>

      {open ? <View style={styles.accordionBody}>{children}</View> : null}
    </View>
  );
}

function DocChips({ docs }: { docs: string[] }) {
  return (
    <View style={styles.docChips}>
      {docs.slice(0, 8).map((d) => (
        <View key={d} style={styles.docChip}>
          <Ionicons name="checkmark" size={14} color="#1D4ED8" />
          <Text style={styles.docChipText} numberOfLines={1}>
            {d}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function CreatePropertyHelpScreen() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [gateMessage, setGateMessage] = useState<string | null>(null);

  const {
    data: plans = [],
    isLoading: plansLoading,
    error: plansError,
  } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const res = await getPlans();
      return res;
    },
    staleTime: 1000 * 60 * 10,
  });

  const planCode = user?.planCode ?? "free";
  const canManageBuildings = useMemo(
    () => planCode === "portfolio" || planCode === "enterprise",
    [planCode]
  );

  const aiOnUpload = useMemo(() => {
    const current = plans?.find((p: any) => p.code === planCode);
    return current?.limits?.aiOnUpload ?? false;
  }, [plans, planCode]);

  const cards: PropertyCard[] = useMemo(
    () => [
      {
        key: "House",
        title: "Moradia",
        emoji: "🏠",
        whenToUse:
          "Quando tens uma casa independente (normalmente sem condomínio gerido).",
        whatYouManage: "Documentos só desse imóvel.",
        docs: [
          "Escritura / Título de aquisição",
          "Caderneta predial",
          "Certidão permanente",
          "Licença de utilização (ou isenção)",
          "Certificado energético",
          "Plantas / desenhos",
          "IMI",
        ],
        cta: "Criar moradia",
        route: "/property/add-property?type=House",
      },
      {
        key: "Apartment",
        title: "Apartamento",
        emoji: "🏢",
        whenToUse:
          "Quando queres gerir só a documentação da tua fração, sem gerir o prédio.",
        whatYouManage: "Documentos da fração (standalone).",
        docs: [
          "Escritura / Título de aquisição",
          "Caderneta predial (da fração)",
          "Certidão permanente",
          "Certificado energético (da fração)",
          "Licença/Isenção (quando aplicável)",
          "Ficha técnica (quando existir)",
          "IMI",
          "Contrato de arrendamento (opcional)",
        ],
        cta: "Criar apartamento",
        route: "/property/add-property?type=Apartment",
      },
      {
        key: "Land",
        title: "Terreno",
        emoji: "🌿",
        whenToUse:
          "Quando é terreno rústico/urbano sem edifício, ou queres gerir a parte do terreno.",
        whatYouManage:
          "Documentos de terreno e processos camarários (quando existem).",
        docs: [
          "Caderneta predial",
          "Certidão permanente",
          "Planta de localização",
          "Levantamento topográfico",
          "PIP / informação prévia (se existir)",
          "Alvará de loteamento (se aplicável)",
          "Pareceres camarários (se existirem)",
        ],
        cta: "Criar terreno",
        route: "/property/add-property?type=Land",
      },
      {
        key: "Building",
        title: "Prédio / Condomínio",
        emoji: "🏬",
        whenToUse:
          "Quando queres gerir um edifício inteiro (partes comuns + frações).",
        whatYouManage:
          "Documentos do prédio (condomínio) + frações, cada uma com os seus documentos.",
        docs: [
          "Atas e regulamento de condomínio",
          "Seguro do edifício (partes comuns)",
          "Contratos de manutenção (elevadores, incêndio, etc.)",
          "Relatórios de contas e quotas",
          "Obras nas partes comuns (orçamentos/faturas)",
          "Inspeções obrigatórias (quando existirem)",
        ],
        cta: "Criar prédio (Portfolio)",
        route: "/property/add-property?type=Building",
        requiresPlanCode: "portfolio",
      },
    ],
    []
  );

  const personalCards = cards.filter((c) => c.key !== "Building");
  const buildingCard = cards.find((c) => c.key === "Building")!;

  function onPressCard(card: PropertyCard) {
    setGateMessage(null);

    if (card.key === "Building" && !canManageBuildings) {
      setGateMessage(
        "A gestão de prédios (partes comuns + frações) está disponível em planos profissionais (Portfolio+)."
      );
      return;
    }

    router.push(card.route);
  }

  function goToPlans() {
    router.push("/profile/plans-help");
  }

  if (plansLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.loadingCard}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>A carregar planos…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (plansError) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.errorCard}>
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle-outline" size={18} color="#DC2626" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.errorTitle}>Não foi possível carregar</Text>
            <Text style={styles.errorMessage}>
              Podes continuar a usar a app. Tenta novamente mais tarde.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="home-outline" size={18} color="#1D4ED8" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Criar imóvel</Text>
            <Text style={styles.subtitle}>
              Escolhe o tipo certo para documentos, alertas e partilhas ficarem
              no sítio correto.
            </Text>
          </View>
        </View>

        {/* Meta */}
        <View style={styles.metaRow}>
          <Pill
            text={`Plano: ${planCode.toUpperCase()}`}
            tone="blue"
            icon="shield-checkmark-outline"
          />
          <Pill
            text={aiOnUpload ? "IA no upload" : "Sem IA no upload"}
            tone={aiOnUpload ? "blue" : "muted"}
            icon={aiOnUpload ? "sparkles-outline" : "remove-circle-outline"}
          />
        </View>

        {/* Gate message (generic) */}
        {gateMessage ? (
          <View style={styles.neutralBanner}>
            <View style={styles.neutralBannerTop}>
              <View style={styles.neutralBannerIcon}>
                <Ionicons name="information-circle-outline" size={18} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.neutralBannerTitle}>
                  Funcionalidade profissional
                </Text>
                <Text style={styles.neutralBannerText}>{gateMessage}</Text>
              </View>
            </View>

            <Pressable onPress={goToPlans} style={styles.neutralBannerBtn}>
              <Text style={styles.neutralBannerBtnText}>Ver planos</Text>
            </Pressable>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Tipos mais comuns</Text>

        {personalCards.map((card) => (
          <Pressable
            key={card.key}
            onPress={() => onPressCard(card)}
            style={styles.card}
          >
            <View style={styles.cardTop}>
              <View style={styles.emojiWrap}>
                <Text style={styles.cardEmoji}>{card.emoji}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.cardWhen}>{card.whenToUse}</Text>
              </View>

              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </View>

            <View style={styles.divider} />

            <Text style={styles.cardLabel}>O que vais gerir</Text>
            <Text style={styles.cardText}>{card.whatYouManage}</Text>

            <Text style={[styles.cardLabel, { marginTop: 10 }]}>
              Documentos típicos
            </Text>

            <DocChips docs={card.docs} />

            <View style={styles.ctaRow}>
              <View style={{ flex: 1 }} />
              <View style={styles.ctaPill}>
                <Text style={styles.ctaPillText}>{card.cta}</Text>
              </View>
            </View>
          </Pressable>
        ))}

        <Text style={styles.sectionTitle}>Profissional</Text>

        {/* Building / Portfolio */}
        <View style={[styles.card, !canManageBuildings && styles.cardLocked]}>
          <View style={styles.cardTop}>
            <View style={styles.emojiWrap}>
              <Text style={styles.cardEmoji}>{buildingCard.emoji}</Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{buildingCard.title}</Text>
              <Text style={styles.cardWhen}>{buildingCard.whenToUse}</Text>
            </View>

            {!canManageBuildings ? (
              <View style={styles.lockPill}>
                <Ionicons
                  name="lock-closed-outline"
                  size={14}
                  color="#64748B"
                />
                <Text style={styles.lockPillText}>Bloqueado</Text>
              </View>
            ) : (
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            )}
          </View>

          <View style={styles.divider} />

          <Text style={styles.cardLabel}>O que vais gerir</Text>
          <Text style={styles.cardText}>{buildingCard.whatYouManage}</Text>

          <Text style={[styles.cardLabel, { marginTop: 10 }]}>
            Documentos típicos (partes comuns)
          </Text>

          <DocChips docs={buildingCard.docs} />

          {/* ✅ KEEP THIS EXACT "Requer Portfolio+" banner styling */}
          {!canManageBuildings ? (
            <InlineBanner
              title="Requer Portfolio+"
              message="Para criar um prédio, precisas de um plano profissional. Podes continuar com moradia/apartamento/terreno no teu plano atual."
              actionText="Ver planos"
              onAction={goToPlans}
            />
          ) : null}

          <Pressable
            onPress={() => onPressCard(buildingCard)}
            style={[
              styles.primaryBtn,
              !canManageBuildings && styles.primaryBtnDisabled,
            ]}
            disabled={!canManageBuildings}
          >
            <Text
              style={[
                styles.primaryBtnText,
                !canManageBuildings && styles.primaryBtnTextDisabled,
              ]}
            >
              {buildingCard.cta}
            </Text>
          </Pressable>

          <Text style={styles.note}>
            Nota: Se queres gerir apenas a tua fração, escolhe
            <Text style={styles.noteStrong}> Apartamento</Text>. “Prédio” é para
            partes comuns + frações.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Dúvidas rápidas</Text>

        <Accordion title="Tenho um apartamento num prédio. Crio “Apartamento” ou “Prédio”?">
          <Text style={styles.faqText}>
            Se queres só a tua documentação (fração), cria
            <Text style={styles.noteStrong}> Apartamento</Text>. Se és
            gestão/condomínio e queres partes comuns + frações, cria
            <Text style={styles.noteStrong}> Prédio</Text>.
          </Text>
        </Accordion>

        <Accordion title="Posso ter documentos do prédio e da fração?">
          <Text style={styles.faqText}>
            Sim. No modo “Prédio”, os documentos das
            <Text style={styles.noteStrong}> partes comuns</Text> ficam no
            prédio e os documentos da{" "}
            <Text style={styles.noteStrong}> fração</Text> ficam dentro da
            fração.
          </Text>
        </Accordion>

        <Accordion title="E se eu escolher o tipo errado?">
          <Text style={styles.faqText}>
            Podes mover documentos entre imóveis (quando implementares essa
            ação). Esta página existe para reduzir esse risco — mas não queremos
            que fiques preso por uma escolha.
          </Text>
        </Accordion>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Page
  safe: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { padding: 16, paddingBottom: 28 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 10,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 22, fontWeight: "900", color: "#0F172A" },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
    lineHeight: 18,
  },

  // Meta pills
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
  pillText: { fontSize: 12, fontWeight: "900", color: "#334155" },
  pillBlue: { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" },
  pillTextBlue: { color: "#1D4ED8" },
  pillMuted: { backgroundColor: "#F1F5F9", borderColor: "#E2E8F0" },
  pillTextMuted: { color: "#64748B" },

  // Section title
  sectionTitle: {
    marginTop: 14,
    marginBottom: 10,
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A",
  },

  // Generic banners
  neutralBanner: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  neutralBannerTop: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  neutralBannerIcon: {
    width: 34,
    height: 34,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  neutralBannerTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#0F172A",
  },
  neutralBannerText: {
    marginTop: 4,
    fontSize: 12.5,
    fontWeight: "700",
    color: "#475569",
    lineHeight: 18,
  },
  neutralBannerBtn: {
    marginTop: 10,
    backgroundColor: "#0F172A",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  neutralBannerBtnText: { color: "#fff", fontWeight: "900" },

  // Cards
  card: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  cardLocked: { backgroundColor: "#FBFDFF" },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  emojiWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  cardEmoji: { fontSize: 20 },
  cardTitle: { fontSize: 15, fontWeight: "900", color: "#0F172A" },
  cardWhen: {
    marginTop: 3,
    fontSize: 12.5,
    fontWeight: "700",
    color: "#64748B",
    lineHeight: 18,
  },

  lockPill: {
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
  lockPillText: { fontSize: 12, fontWeight: "900", color: "#64748B" },

  divider: { height: 1, backgroundColor: "#EEF2F7", marginVertical: 12 },

  cardLabel: { fontSize: 12, fontWeight: "900", color: "#0F172A" },
  cardText: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
    lineHeight: 18,
  },

  // Docs as chips
  docChips: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  docChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    maxWidth: "100%",
  },
  docChipText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1D4ED8",
    maxWidth: 230,
  },

  // CTA row small
  ctaRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  ctaPill: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "#0F172A",
  },
  ctaPillText: { color: "#fff", fontWeight: "900", fontSize: 12 },

  // Primary action
  primaryBtn: {
    marginTop: 12,
    backgroundColor: "#0F172A",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "900" },
  primaryBtnDisabled: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  primaryBtnTextDisabled: { color: "#94A3B8" },

  note: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    lineHeight: 18,
  },
  noteStrong: { fontWeight: "900", color: "#0F172A" },

  // Accordion
  accordion: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  accordionTitle: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: "900",
    color: "#0F172A",
    paddingRight: 10,
  },
  accordionChevronWrap: {
    width: 34,
    height: 34,
    borderRadius: 14,
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
    fontWeight: "700",
    color: "#475569",
    lineHeight: 18,
  },

  // Loading + error cards
  loadingCard: {
    margin: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  loadingText: { fontWeight: "900", color: "#0F172A" },

  errorCard: {
    margin: 16,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  errorIcon: {
    width: 34,
    height: 34,
    borderRadius: 14,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  errorTitle: { fontWeight: "900", color: "#7F1D1D" },
  errorMessage: {
    marginTop: 3,
    fontWeight: "700",
    color: "#991B1B",
    lineHeight: 18,
    fontSize: 12.5,
  },

  /**
   * ✅ KEEP EXACTLY THIS "Requer Portfolio+" styling block (ONLY THIS)
   * do NOT refactor this section.
   */
  banner: {
    borderWidth: 1,
    borderColor: "#E8D9A8",
    backgroundColor: "#FFF6D8",
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  bannerTitle: { fontWeight: "900", marginBottom: 4, color: "#3A2F00" },
  bannerMessage: { color: "#3A2F00", lineHeight: 18, fontWeight: "700" },
  bannerButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
    borderRadius: 10,
    backgroundColor: "#111",
  },
  bannerButtonText: { color: "#fff", fontWeight: "800" },
});
