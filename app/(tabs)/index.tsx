// HomeScreen.tsx
import React, { useContext, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/hooks/services/api";
import { Property, PropertyType } from "@/types/models";
import { useRouter } from "expo-router";
import { Alert as AlertComponent } from "@/components/Alert";
import { AuthContext } from "@/context/AuthContext";
import { getAllProperties } from "@/hooks/services/property";
import { useQuery } from "@tanstack/react-query";
import { LoadErrorScreen } from "@/components/StateScreens";
// import { IslandDock } from "@/components/IslandDock";

// function mapPathToDock(path: string) {
//   if (path.startsWith("/profile")) return "profile";
//   if (path.startsWith("/help")) return "help";
//   if (path.startsWith("/settings")) return "settings";
//   return "home";
// }

function Pill({ text }: { text: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>{text}</Text>
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

function QuickCard({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.quickCard}>
      <Ionicons name={icon} size={18} />
      <Text style={styles.quickTitle}>{title}</Text>
      <Text style={styles.quickSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

function propertyTypeLabel(type: PropertyType) {
  switch (type) {
    case PropertyType.House:
      return "Moradia";
    case PropertyType.Apartment:
      return "Apartamento";
    case PropertyType.Land:
      return "Terreno";
    case PropertyType.Building:
      return "Prédio";
    case PropertyType.Unit:
      return "Fração";
    default:
      return "Imóvel";
  }
}

function PropertyMiniCard({
  p,
  onPress,
}: {
  p: Property;
  onPress: () => void;
}) {
  const alertsCount = p.alerts?.length ?? 0;
  const docsCount = p.documents?.length ?? 0;

  const hasAlerts = alertsCount > 0;

  return (
    <Pressable onPress={onPress} style={styles.propertyRow}>
      {/* Left accent */}
      <View
        style={[
          styles.statusDot,
          hasAlerts ? styles.statusDotAlert : styles.statusDotOk,
        ]}
      />

      <View style={{ flex: 1 }}>
        <Text style={styles.propertyName} numberOfLines={1}>
          {p.name}
        </Text>

        <Text style={styles.propertyMeta} numberOfLines={1}>
          {propertyTypeLabel(p.type)}
          {p.streetName ? ` • ${p.streetName}` : ""}
        </Text>

        <View style={styles.propertyFooter}>
          <Text style={styles.footerText}>{docsCount} documentos</Text>

          <Text
            style={[
              styles.footerStatus,
              hasAlerts ? styles.footerStatusAlert : styles.footerStatusOk,
            ]}
          >
            {hasAlerts
              ? `${alertsCount} alerta${alertsCount === 1 ? "" : "s"}`
              : "Sem alertas"}
          </Text>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
    </Pressable>
  );
}

export default function HomeScreen() {
  const { logout } = useContext(AuthContext);
  const router = useRouter();
  // const pathname = usePathname();

  // React Query for properties
  const {
    data: properties = [],
    isLoading: propertiesLoading,
    isFetching: propertiesFetching,
    refetch: refetchProperties,
    error: propertiesError,
  } = useQuery({
    queryKey: ["properties"],
    queryFn: async () => {
      const res = await getAllProperties();
      return res.items ?? [];
    },
    staleTime: 1000 * 60 * 5,
  });

  // React Query for alerts
  const {
    data: alerts = [],
    isLoading: alertsLoading,
    isFetching: alertsFetching,
    refetch: refetchAlerts,
    error: alertsError,
  } = useQuery({
    queryKey: ["alerts", 30],
    queryFn: async () => {
      const res = await api.get("/alerts/upcoming?days=30");
      return res.data ?? [];
    },
    staleTime: 1000 * 60 * 2,
  });

  const isLoading = propertiesLoading || alertsLoading;
  const isFetching = propertiesFetching || alertsFetching;

  const onRefresh = async () => {
    await Promise.all([refetchProperties(), refetchAlerts()]);
  };

  const alertsPreview = useMemo(() => alerts.slice(0, 3), [alerts]);
  const totalAlerts = alerts.length;

  const retryCount = useRef(0);
  const [retryDisabled, setRetryDisabled] = useState(false);
  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };
  const onRetry = async () => {
    if (retryDisabled) return;
    try {
      await Promise.all([refetchProperties(), refetchAlerts()]);
      // If successful, reset retry count
      retryCount.current = 0;
      setRetryDisabled(false);
    } catch {
      retryCount.current += 1;
      if (retryCount.current >= 3) {
        setRetryDisabled(true);
      }
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }
  if (propertiesError || alertsError) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <LoadErrorScreen
          onRetry={onRetry}
          title="Erro ao carregar dados"
          subtitle={
            retryDisabled
              ? "Muitas tentativas falhadas. Tenta novamente mais tarde."
              : "Não conseguimos obter os imóveis/alertas. Tenta novamente."
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.appTitle}>CasaPronta</Text>
            <View style={styles.headerPills}>
              <Pill text={`${properties.length} imóveis`} />
              <Pill text={`${totalAlerts} alertas (30d)`} />
            </View>
          </View>
          <Pressable
            style={styles.iconBtn}
            onPress={() => router.push("/admin")}
            hitSlop={10}
          >
            <Ionicons name="person-circle-outline" color="red" size={22} />
          </Pressable>
          <Pressable
            style={styles.iconBtn}
            onPress={() => router.push("/notifications")}
            hitSlop={10}
          >
            <Ionicons name="notifications-outline" size={20} />
          </Pressable>

          <Pressable
            style={styles.iconBtn}
            onPress={() => router.push("/profile")}
            hitSlop={10}
          >
            <Ionicons name="person-circle-outline" size={22} />
          </Pressable>

          <Pressable
            style={styles.logoutBtn}
            onPress={handleLogout}
            hitSlop={10}
          >
            <Text style={styles.logoutText}>Sair</Text>
          </Pressable>
        </View>

        {/* Quick actions */}
        <View style={styles.quickRow}>
          <QuickCard
            icon="help-circle-outline"
            title="Como funciona"
            subtitle="Tipos de imóveis"
            onPress={() => router.push("/property/about")}
          />
          <QuickCard
            icon="card-outline"
            title="Planos"
            subtitle="Limites e IA"
            onPress={() => router.push("/profile/plans-help")}
          />
          <QuickCard
            icon="add-circle-outline"
            title="Criar"
            subtitle="Novo imóvel"
            onPress={() => router.push("/property/add-property")}
          />
        </View>

        {/* Highlights */}
        <View style={styles.highlights}>
          <View style={styles.highlightCard}>
            <Text style={styles.highlightValue}>{properties.length}</Text>
            <Text style={styles.highlightLabel}>Imóveis</Text>
          </View>
          <View style={styles.highlightCardDark}>
            <Text style={styles.highlightValueDark}>{totalAlerts}</Text>
            <Text style={styles.highlightLabelDark}>Alertas (30 dias)</Text>
          </View>
        </View>

        {/* Alerts */}
        <SectionHeader
          title="Atenção"
          actionText={alerts.length > 3 ? "Ver tudo" : undefined}
          onAction={
            alerts.length > 3 ? () => router.push("/notifications") : undefined
          }
        />

        {alerts.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>Tudo em dia ✅</Text>
            <Text style={styles.emptyText}>Não há alertas próximos.</Text>
          </View>
        ) : (
          <View style={styles.listBox}>
            {alertsPreview.map((a) => (
              <View key={a.id} style={{ marginBottom: 10 }}>
                <AlertComponent
                  title={a.message}
                  description={
                    a.date
                      ? `Data: ${new Date(a.date).toLocaleDateString("pt-PT")}`
                      : undefined
                  }
                  variant={"warning"}
                />
              </View>
            ))}
          </View>
        )}

        {/* Properties */}
        <SectionHeader
          title="Os teus imóveis"
          actionText="Gerir"
          onAction={() => router.push("/property")}
        />

        {properties.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>Sem imóveis ainda</Text>
            <Text style={styles.emptyText}>
              Cria o teu primeiro imóvel para começares a organizar documentos e
              alertas.
            </Text>

            <Pressable
              style={styles.primaryCta}
              onPress={() => router.push("/property/add-property")}
            >
              <Text style={styles.primaryCtaText}>Adicionar imóvel</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {properties.map((p) => (
              <PropertyMiniCard
                key={p.id?.toString() ?? p.name}
                p={p}
                onPress={() => router.push(`/property/${p.id}`)}
              />
            ))}
          </View>
        )}

        <View style={{ height: 18 }} />
      </ScrollView>
      {/* <IslandDock
        active={mapPathToDock(pathname) as any}
        onNavigate={(r) => {
          if (r === "home") router.push("/");
          if (r === "profile") router.push("/profile");
          if (r === "help") router.push("/help");
          if (r === "settings") router.push("/settings");
        }}
      /> */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff", position: "relative" },
  container: { padding: 16, paddingBottom: 24 },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  appTitle: { fontSize: 22, fontWeight: "900" },
  headerPills: { flexDirection: "row", gap: 8, marginTop: 8, flexWrap: "wrap" },

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
  logoutBtn: {
    height: 40,
    borderRadius: 14,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  logoutText: { color: "#fff", fontWeight: "900", fontSize: 12 },

  quickRow: { flexDirection: "row", gap: 10, marginTop: 6, flexWrap: "wrap" },

  quickCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    backgroundColor: "#fff",
  },
  quickTitle: { marginTop: 10, fontWeight: "900", fontSize: 13 },
  quickSubtitle: { marginTop: 4, color: "#666", fontSize: 12, lineHeight: 16 },

  highlights: { flexDirection: "row", gap: 10, marginTop: 12, marginBottom: 6 },
  highlightCard: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: "#F7F7F7",
    padding: 14,
  },
  highlightValue: { fontSize: 18, fontWeight: "900", color: "#111" },
  highlightLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "800",
    color: "#666",
  },

  highlightCardDark: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: "#111",
    padding: 14,
  },
  highlightValueDark: { fontSize: 18, fontWeight: "900", color: "#fff" },
  highlightLabelDark: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "800",
    color: "#CFCFCF",
  },

  sectionHeader: {
    marginTop: 16,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { fontSize: 16, fontWeight: "900" },
  sectionAction: { fontSize: 13, fontWeight: "900", color: "#111" },

  listBox: {
    borderWidth: 1,
    borderColor: "#EAEAEA",
    borderRadius: 16,
    padding: 12,
    backgroundColor: "#fff",
  },
  propertyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  statusDot: {
    width: 6,
    height: 36,
    borderRadius: 999,
  },
  statusDotOk: {
    backgroundColor: "#22C55E",
  },
  statusDotAlert: {
    backgroundColor: "#EF4444",
  },

  propertyName: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A",
  },

  propertyMeta: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },

  propertyFooter: {
    marginTop: 6,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },

  footerText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },

  footerStatus: {
    fontSize: 12,
    fontWeight: "900",
  },

  footerStatusOk: {
    color: "#16A34A",
  },

  footerStatusAlert: {
    color: "#DC2626",
  },

  emptyBox: {
    borderWidth: 1,
    borderColor: "#EAEAEA",
    borderRadius: 16,
    padding: 14,
    backgroundColor: "#FAFAFA",
  },
  emptyTitle: { fontWeight: "900", marginBottom: 6, fontSize: 14 },
  emptyText: { color: "#555", lineHeight: 18, fontSize: 13 },

  primaryCta: {
    marginTop: 12,
    backgroundColor: "#111",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryCtaText: { color: "#fff", fontWeight: "900" },

  propertyCard: {
    borderWidth: 1,
    borderColor: "#EAEAEA",
    borderRadius: 16,
    padding: 14,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  propertyName: { fontSize: 14, fontWeight: "900", color: "#111" },
  propertyMeta: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700",
    color: "#666",
  },

  badge: {
    minWidth: 34,
    height: 30,
    borderRadius: 12,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  badgeText: { color: "#fff", fontWeight: "900", fontSize: 12 },
  badgeMuted: {
    minWidth: 34,
    height: 30,
    borderRadius: 12,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  badgeTextMuted: { color: "#999", fontWeight: "900", fontSize: 12 },

  devLink: {
    marginTop: 16,
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  devLinkText: { color: "#666", fontWeight: "800" },
});
