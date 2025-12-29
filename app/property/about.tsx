// app/(tabs)/properties/create-help.tsx  (exemplo)
// ou onde fizer sentido no teu Expo Router

import React, { useEffect, useMemo, useState } from "react";
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
import { api } from "@/hooks/services/api";
import { SubscriptionPlanDto } from "@/types/models"; // or "@/context/AuthContext"

type CurrentSubscriptionDto = {
  planCode: string;
  status: string;
};

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

function Pill({ text }: { text: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>{text}</Text>
    </View>
  );
}

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
      <Pressable onPress={toggle} style={styles.accordionHeader}>
        <Text style={styles.accordionTitle}>{title}</Text>
        <Text style={styles.accordionChevron}>{open ? "−" : "+"}</Text>
      </Pressable>
      {open ? <View style={styles.accordionBody}>{children}</View> : null}
    </View>
  );
}

export default function CreatePropertyHelpScreen() {
  const router = useRouter();
  const [plans, setPlans] = useState<SubscriptionPlanDto[] | null>(null);
  const [current, setCurrent] = useState<CurrentSubscriptionDto | null>(null);
  const [gateMessage, setGateMessage] = useState<string | null>(null);

  // --- Load plans + current subscription ---
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // Se já tens endpoints, usa os teus.
        // Sugestões:
        // GET /api/subscriptions/plans
        // GET /api/subscriptions/current (ou /me)
        const [plansRes, currentRes] = await Promise.all([
          api.get("/api/subscriptions/plans"),
          api.get("/api/subscriptions/current"), // adapta
        ]);

        if (!mounted) return;

        setPlans(plansRes.data as SubscriptionPlanDto[]);
        setCurrent(currentRes.data as CurrentSubscriptionDto);
      } catch {
        // falha silenciosa: não quebra UI
        // Mantém fallback Free
        if (!mounted) return;
        setPlans(null);
        setCurrent({ planCode: "free", status: "active" });
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const planCode = current?.planCode ?? "free";

  const canManageBuildings = useMemo(() => {
    // Regras simples:
    // - Building/fractions disponível a partir de Portfolio (e Enterprise)
    // - Se quiseres, podes incluir Enterprise também
    return planCode === "portfolio" || planCode === "enterprise";
  }, [planCode]);

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
    router.push("/profile/subscription"); // ajusta para o teu route real
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Criar imóvel</Text>
        <Text style={styles.subtitle}>
          Escolhe o tipo certo para a documentação, alertas e partilhas ficarem
          no sítio correto.
        </Text>

        <View style={styles.metaRow}>
          <Pill text={`Plano: ${planCode.toUpperCase()}`} />
          {plans?.find((p) => p.code === planCode)?.limits?.AiOnUpload ? (
            <Pill text="IA no upload" />
          ) : (
            <Pill text="Sem IA no upload" />
          )}
        </View>

        {gateMessage ? (
          <InlineBanner
            title="Funcionalidade profissional"
            message={gateMessage}
            actionText="Ver planos"
            onAction={goToPlans}
          />
        ) : null}

        <Text style={styles.sectionTitle}>Tipos mais comuns</Text>

        {personalCards.map((card) => (
          <View key={card.key} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardEmoji}>{card.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.cardWhen}>{card.whenToUse}</Text>
              </View>
            </View>

            <Text style={styles.cardInfoLabel}>O que vais gerir</Text>
            <Text style={styles.cardInfo}>{card.whatYouManage}</Text>

            <Text style={styles.cardInfoLabel}>Documentos típicos</Text>
            <View style={styles.bullets}>
              {card.docs.slice(0, 6).map((d, idx) => (
                <Text key={idx} style={styles.bullet}>
                  • {d}
                </Text>
              ))}
            </View>

            <Pressable onPress={() => onPressCard(card)} style={styles.cta}>
              <Text style={styles.ctaText}>{card.cta}</Text>
            </Pressable>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Profissional</Text>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardEmoji}>{buildingCard.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{buildingCard.title}</Text>
              <Text style={styles.cardWhen}>{buildingCard.whenToUse}</Text>
            </View>
          </View>

          <Text style={styles.cardInfoLabel}>O que vais gerir</Text>
          <Text style={styles.cardInfo}>{buildingCard.whatYouManage}</Text>

          <Text style={styles.cardInfoLabel}>
            Documentos típicos (partes comuns)
          </Text>
          <View style={styles.bullets}>
            {buildingCard.docs.map((d, idx) => (
              <Text key={idx} style={styles.bullet}>
                • {d}
              </Text>
            ))}
          </View>

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
            style={[styles.cta, !canManageBuildings && styles.ctaDisabled]}
            disabled={!canManageBuildings}
          >
            <Text
              style={[
                styles.ctaText,
                !canManageBuildings && styles.ctaTextDisabled,
              ]}
            >
              {buildingCard.cta}
            </Text>
          </Pressable>

          <Text style={styles.note}>
            Nota: Se queres gerir apenas a tua fração, escolhe
            <Text style={styles.noteStrong}>Apartamento</Text>. “Prédio” é para
            partes comuns + frações.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Dúvidas rápidas</Text>

        <Accordion title="Tenho um apartamento num prédio. Crio “Apartamento” ou “Prédio”?">
          <Text style={styles.faqText}>
            Se queres só a tua documentação (fração), cria
            <Text style={styles.noteStrong}>Apartamento</Text>. Se és
            gestão/condomínio e queres partes comuns + frações, cria
            <Text style={styles.noteStrong}>Prédio</Text>.
          </Text>
        </Accordion>

        <Accordion title="Posso ter documentos do prédio e da fração?">
          <Text style={styles.faqText}>
            Sim. No modo “Prédio”, os documentos das
            <Text style={styles.noteStrong}>partes comuns</Text> ficam no prédio
            e os documentos da <Text style={styles.noteStrong}>fração</Text>
            ficam dentro da fração.
          </Text>
        </Accordion>

        <Accordion title="E se eu escolher o tipo errado?">
          <Text style={styles.faqText}>
            Podes mover documentos entre imóveis (quando implementares essa
            ação). Esta página existe para reduzir esse risco, mas não queremos
            que fiques preso por uma escolha.
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
  pillText: { fontSize: 12, color: "#333", fontWeight: "600" },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
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
  cardHeader: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  cardEmoji: { fontSize: 22, marginTop: 2 },
  cardTitle: { fontSize: 16, fontWeight: "800", marginBottom: 4 },
  cardWhen: { fontSize: 13, color: "#555", lineHeight: 18 },

  cardInfoLabel: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "800",
    color: "#222",
  },
  cardInfo: { marginTop: 4, fontSize: 13, color: "#444", lineHeight: 18 },

  bullets: { marginTop: 6 },
  bullet: { fontSize: 13, color: "#444", lineHeight: 18, marginBottom: 4 },

  cta: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#111",
    alignItems: "center",
  },
  ctaText: { color: "#fff", fontWeight: "800" },
  ctaDisabled: { backgroundColor: "#EAEAEA" },
  ctaTextDisabled: { color: "#999" },

  note: { marginTop: 10, fontSize: 12, color: "#555", lineHeight: 18 },
  noteStrong: { fontWeight: "800", color: "#111" },

  banner: {
    borderWidth: 1,
    borderColor: "#E8D9A8",
    backgroundColor: "#FFF6D8",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  bannerTitle: { fontWeight: "900", marginBottom: 4, color: "#3A2F00" },
  bannerMessage: { color: "#3A2F00", lineHeight: 18 },
  bannerButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
    borderRadius: 10,
    backgroundColor: "#111",
  },
  bannerButtonText: { color: "#fff", fontWeight: "800" },

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
    fontWeight: "800",
    flex: 1,
    paddingRight: 10,
  },
  accordionChevron: { fontSize: 18, fontWeight: "900" },
  accordionBody: { marginTop: 10 },
  faqText: { fontSize: 13, color: "#444", lineHeight: 18 },
});
