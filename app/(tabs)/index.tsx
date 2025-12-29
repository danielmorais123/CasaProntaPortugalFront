// HomeScreen.tsx
import React, { useEffect, useState, useContext, useMemo } from "react";
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
import { Property, Alert, PropertyType } from "@/types/models";
import { useRouter } from "expo-router";
import { Alert as AlertComponent } from "@/components/Alert";
import { AuthContext } from "@/context/AuthContext";
import { getAllProperties } from "@/hooks/services/property";

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

  return (
    <Pressable onPress={onPress} style={styles.propertyCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.propertyName} numberOfLines={1}>
          {p.name}
        </Text>
        <Text style={styles.propertyMeta} numberOfLines={1}>
          {propertyTypeLabel(p.type)}
          {p.streetName ? ` • ${p.streetName}` : ""}
          {` • ${docsCount} docs`}
        </Text>
      </View>

      <View style={alertsCount > 0 ? styles.badge : styles.badgeMuted}>
        <Text
          style={alertsCount > 0 ? styles.badgeText : styles.badgeTextMuted}
        >
          {alertsCount}
        </Text>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { logout } = useContext(AuthContext);
  const router = useRouter();

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      const [propertiesRes, alertsRes] = await Promise.all([
        getAllProperties(), // Use the service
        api.get("/alerts/upcoming?days=30"),
      ]);

      setProperties(propertiesRes.items ?? []); // getAllProperties returns a paged result
      setAlerts(alertsRes.data ?? []);
    } catch (e) {
      // ✅ não limpar para não “piscar” UI feia em caso de erro
      // (mantém dados antigos)
    } finally {
      if (!silent) setLoading(false);
    }
  };
  console.log({ properties });
  useEffect(() => {
    fetchData(false);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData(true);
    setRefreshing(false);
  };

  const alertsPreview = useMemo(() => alerts.slice(0, 3), [alerts]);
  const totalAlerts = alerts.length;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" />
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

          <Pressable style={styles.logoutBtn} onPress={logout} hitSlop={10}>
            <Text style={styles.logoutText}>Sair</Text>
          </Pressable>
        </View>

        {/* Quick actions (em vez de 2 botões azuis gigantes) */}
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

        {/* (Opcional) dev shortcut */}
        <Pressable
          onPress={() => router.push("/payments/payment")}
          style={styles.devLink}
        >
          <Text style={styles.devLinkText}>Payment</Text>
        </Pressable>

        <View style={{ height: 18 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
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

  quickRow: { flexDirection: "row", gap: 10, marginTop: 6 },

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
