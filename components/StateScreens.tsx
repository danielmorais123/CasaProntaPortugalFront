import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

type Tone = "danger" | "neutral" | "blue" | "warn";

function toneColors(tone: Tone) {
  switch (tone) {
    case "blue":
      return {
        bg: "#EFF6FF",
        border: "#BFDBFE",
        iconBg: "#DBEAFE",
        icon: "#1D4ED8",
        pillBg: "#EFF6FF",
        pillBorder: "#BFDBFE",
        pillText: "#1D4ED8",
      };
    case "warn":
      return {
        bg: "#FFFBEB",
        border: "#FDE68A",
        iconBg: "#FEF3C7",
        icon: "#92400E",
        pillBg: "#FFFBEB",
        pillBorder: "#FDE68A",
        pillText: "#92400E",
      };
    case "neutral":
      return {
        bg: "#F1F5F9",
        border: "#E2E8F0",
        iconBg: "#E2E8F0",
        icon: "#334155",
        pillBg: "#F1F5F9",
        pillBorder: "#E2E8F0",
        pillText: "#334155",
      };
    default:
      return {
        bg: "#FEF2F2",
        border: "#FECACA",
        iconBg: "#FEE2E2",
        icon: "#B91C1C",
        pillBg: "#FEF2F2",
        pillBorder: "#FECACA",
        pillText: "#B91C1C",
      };
  }
}

function TopBar({
  title,
  onBack,
  rightIcon,
  onRight,
}: {
  title: string;
  onBack?: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRight?: () => void;
}) {
  return (
    <View style={styles.topBar}>
      <Pressable
        style={[styles.iconBtn, !onBack && { opacity: 0 }]}
        onPress={onBack}
        disabled={!onBack}
        hitSlop={10}
      >
        <Ionicons name="arrow-back" size={18} color="#0F172A" />
      </Pressable>

      <Text style={styles.topTitle} numberOfLines={1}>
        {title}
      </Text>

      <Pressable
        style={[styles.iconBtn, !(rightIcon && onRight) && { opacity: 0 }]}
        onPress={onRight}
        disabled={!(rightIcon && onRight)}
        hitSlop={10}
      >
        <Ionicons
          name={rightIcon ?? "help-circle-outline"}
          size={18}
          color="#0F172A"
        />
      </Pressable>
    </View>
  );
}

function BigHero({
  tone,
  icon,
  eyebrow,
  title,
  subtitle,
}: {
  tone: Tone;
  icon: keyof typeof Ionicons.glyphMap;
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  const c = toneColors(tone);

  return (
    <View
      style={[styles.hero, { backgroundColor: c.bg, borderColor: c.border }]}
    >
      <View style={[styles.heroIconOuter, { borderColor: c.border }]}>
        <View style={[styles.heroIconInner, { backgroundColor: c.iconBg }]}>
          <Ionicons name={icon} size={26} color={c.icon} />
        </View>
      </View>

      <View style={{ flex: 1 }}>
        {eyebrow ? (
          <Text style={[styles.eyebrow, { color: c.pillText }]}>{eyebrow}</Text>
        ) : null}
        <Text style={styles.heroTitle}>{title}</Text>
        {subtitle ? <Text style={styles.heroSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

function Chip({
  tone,
  icon,
  text,
}: {
  tone: Tone;
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  const c = toneColors(tone);
  return (
    <View
      style={[
        styles.chip,
        { backgroundColor: c.pillBg, borderColor: c.pillBorder },
      ]}
    >
      <Ionicons name={icon} size={14} color={c.pillText} />
      <Text style={[styles.chipText, { color: c.pillText }]}>{text}</Text>
    </View>
  );
}

function PrimaryButton({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.primaryBtn} onPress={onPress}>
      {icon ? <Ionicons name={icon} size={18} color="#fff" /> : null}
      <Text style={styles.primaryBtnText}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.secondaryBtn} onPress={onPress}>
      {icon ? <Ionicons name={icon} size={18} color="#0F172A" /> : null}
      <Text style={styles.secondaryBtnText}>{label}</Text>
    </Pressable>
  );
}

function SmallCard({
  title,
  subtitle,
  tone = "neutral",
  icon,
}: {
  title: string;
  subtitle: string;
  tone?: Tone;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  const c = toneColors(tone);
  return (
    <View style={styles.smallCard}>
      <View
        style={[
          styles.smallIcon,
          { backgroundColor: c.bg, borderColor: c.border },
        ]}
      >
        <Ionicons name={icon} size={16} color={c.icon} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.smallTitle}>{title}</Text>
        <Text style={styles.smallSub}>{subtitle}</Text>
      </View>
    </View>
  );
}

/** -------- LOAD ERROR -------- */
export function LoadErrorScreen({
  onRetry,
  title = "Não foi possível carregar",
  subtitle = "Pode ser temporário. Verifica a ligação e tenta novamente.",
  details,
  showBack = true,
}: {
  onRetry: () => void;
  title?: string;
  subtitle?: string;
  details?: string; // opcional para debug
  showBack?: boolean;
}) {
  const router = useRouter();

  return (
    <View style={styles.safe}>
      <TopBar
        title="Erro"
        onBack={showBack ? () => router.back() : undefined}
      />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <BigHero
          tone="danger"
          icon="alert-circle-outline"
          eyebrow="Algo correu mal"
          title={title}
          subtitle={subtitle}
        />

        <View style={styles.chipsRow}>
          <Chip tone="danger" icon="wifi-outline" text="Ligação" />
          <Chip tone="danger" icon="cloud-offline-outline" text="Servidor" />
          <Chip tone="danger" icon="time-outline" text="Tenta novamente" />
        </View>

        <View style={styles.mainCard}>
          <Text style={styles.mainTitle}>O que podes fazer agora</Text>

          <View style={{ gap: 10 }}>
            <SmallCard
              tone="neutral"
              icon="refresh-outline"
              title="Recarregar"
              subtitle="Tenta de novo — muitas vezes resolve."
            />
            <SmallCard
              tone="blue"
              icon="wifi-outline"
              title="Verificar internet"
              subtitle="Confirma Wi-Fi/4G e tenta novamente."
            />
            <SmallCard
              tone="warn"
              icon="hourglass-outline"
              title="Tentar mais tarde"
              subtitle="Se for manutenção, volta em alguns minutos."
            />
          </View>

          <View style={styles.actionsRow}>
            <PrimaryButton
              label="Tentar novamente"
              icon="refresh-outline"
              onPress={onRetry}
            />
            <SecondaryButton
              label="Voltar"
              icon="arrow-back"
              onPress={() => router.back()}
            />
          </View>

          {details ? (
            <View style={styles.detailsBox}>
              <Text style={styles.detailsLabel}>Detalhes</Text>
              <Text style={styles.detailsText}>{details}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

/** -------- 404 -------- */
export function NotFoundScreen({
  homeRoute = "/",
  title = "Página não encontrada",
  subtitle = "O link pode estar errado ou a página já não existe.",
  showBack = true,
}: {
  homeRoute?: string;
  title?: string;
  subtitle?: string;
  showBack?: boolean;
}) {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <TopBar title="404" onBack={showBack ? () => router.back() : undefined} />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <BigHero
          tone="neutral"
          icon="search-outline"
          eyebrow="Ups…"
          title={title}
          subtitle={subtitle}
        />

        <View style={styles.codeCard}>
          <Text style={styles.codeBig}>404</Text>
          <Text style={styles.codeSub}>Rota inválida</Text>
        </View>

        <View style={styles.mainCard}>
          <Text style={styles.mainTitle}>Sugestões</Text>

          <View style={{ gap: 10 }}>
            <SmallCard
              tone="blue"
              icon="home-outline"
              title="Voltar ao início"
              subtitle="Ir para a Home e continuar a navegação."
            />
            <SmallCard
              tone="neutral"
              icon="arrow-back-outline"
              title="Voltar atrás"
              subtitle="Regressa à página anterior."
            />
            <SmallCard
              tone="warn"
              icon="link-outline"
              title="Verificar o link"
              subtitle="Se abriste via notificação, pode estar desatualizado."
            />
          </View>

          <View style={styles.actionsRow}>
            <PrimaryButton
              label="Ir para Home"
              icon="home-outline"
              onPress={() => router.push(homeRoute as any)}
            />
            <SecondaryButton
              label="Voltar"
              icon="arrow-back"
              onPress={() => router.back()}
            />
          </View>

          <View style={styles.tipBox}>
            <View style={styles.tipIcon}>
              <Ionicons
                name="shield-checkmark-outline"
                size={16}
                color="#047857"
              />
            </View>
            <Text style={styles.tipText}>
              Nada foi alterado. É só uma página que não existe.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },

  topBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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

  container: { padding: 16, paddingBottom: 24 },

  hero: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  heroIconOuter: {
    width: 58,
    height: 58,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroIconInner: {
    width: 46,
    height: 46,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: { fontSize: 12, fontWeight: "900" },
  heroTitle: {
    marginTop: 3,
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },
  heroSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#475569",
    fontWeight: "700",
    lineHeight: 18,
  },

  chipsRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 12 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontSize: 12, fontWeight: "900" },

  codeCard: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 14,
    alignItems: "center",
  },
  codeBig: {
    fontSize: 46,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 2,
  },
  codeSub: { marginTop: 2, fontSize: 12, fontWeight: "900", color: "#64748B" },

  mainCard: {
    marginTop: 12,
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
  mainTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 10,
  },

  smallCard: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  smallIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  smallTitle: { fontSize: 13, fontWeight: "900", color: "#0F172A" },
  smallSub: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    lineHeight: 16,
  },

  actionsRow: { marginTop: 12, gap: 10 },
  primaryBtn: {
    backgroundColor: "#0F172A",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryBtnText: { color: "#fff", fontWeight: "900" },

  secondaryBtn: {
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
  secondaryBtnText: { color: "#0F172A", fontWeight: "900" },

  detailsBox: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 12,
  },
  detailsLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 6,
  },
  detailsText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    lineHeight: 16,
  },

  tipBox: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  tipIcon: {
    width: 34,
    height: 34,
    borderRadius: 14,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    alignItems: "center",
    justifyContent: "center",
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
    lineHeight: 18,
  },
});
