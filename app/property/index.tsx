import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  RefreshControl,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Property } from "@/types/models";
import { getAllProperties } from "@/hooks/services/property";
import { useQuery } from "@tanstack/react-query";

/* -----------------------------------------------------
 * Small reusable components
 * ---------------------------------------------------*/

function EmptyState({
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
    <View style={styles.emptyBox}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{message}</Text>

      {actionText && onAction ? (
        <Pressable onPress={onAction} style={styles.primaryCta}>
          <Text style={styles.primaryCtaText}>{actionText}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function PropertyRow({ p, onPress }: { p: Property; onPress: () => void }) {
  const docsCount = p.documents?.length ?? 0;
  const alertsCount = p.alerts?.length ?? 0;

  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name="home-outline" size={18} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {p.name}
        </Text>

        <Text style={styles.rowSubtitle} numberOfLines={1}>
          {p.streetName || "—"}
        </Text>

        <View style={styles.rowMeta}>
          <Text style={styles.metaText}>
            Docs: <Text style={styles.metaStrong}>{docsCount}</Text>
          </Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaText}>
            Alertas: <Text style={styles.metaStrong}>{alertsCount}</Text>
          </Text>
        </View>
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

function BuildingCard({
  building,
  onOpenBuilding,
  onOpenUnit,
}: {
  building: Property;
  onOpenBuilding: () => void;
  onOpenUnit: (unitId: string) => void;
}) {
  return (
    <View style={styles.buildingCard}>
      {/* Header do prédio */}
      <Pressable onPress={onOpenBuilding} style={styles.buildingHeader}>
        <View style={styles.buildingIcon}>
          <Ionicons name="business-outline" size={18} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {building.name}
          </Text>
          <Text style={styles.rowSubtitle} numberOfLines={1}>
            {building.streetName || "—"}
          </Text>

          <Text style={styles.buildingMeta}>
            {building.units?.length ?? 0} frações •{" "}
            {building.documents?.length ?? 0} docs comuns
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color="#999" />
      </Pressable>

      {/* Frações */}
      {building.units?.length > 0 && (
        <View style={styles.unitsList}>
          {building.units.map((u) => (
            <Pressable
              key={u.id}
              onPress={() => onOpenUnit(u.id)}
              style={styles.unitRow}
            >
              <Ionicons name="home-outline" size={16} color="#555" />
              <Text style={styles.unitText} numberOfLines={1}>
                {u.name}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#BBB" />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

/* -----------------------------------------------------
 * Main screen
 * ---------------------------------------------------*/

export default function PropertiesScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["properties"],
    queryFn: async () => {
      const res = await getAllProperties();
      return res.items ?? [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const items = data ?? [];

  const { buildings, standalone } = useMemo(() => {
    const buildings = items.filter((p) => p.type === 4); // Building
    const standalone = items.filter((p) => p.type !== 4 && !p.parentPropertyId);
    return { buildings, standalone };
  }, [items]);

  const filteredStandalone = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return standalone;

    return standalone.filter((p) => {
      return (
        p.name.toLowerCase().includes(q) ||
        p.streetName.toLowerCase().includes(q)
      );
    });
  }, [standalone, query]);

  if (isLoading || isFetching) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>A carregar imóveis…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color="#F87171" />
          <Text style={styles.emptyTitle}>Erro ao carregar imóveis</Text>
          <Text style={styles.emptyText}>Tenta novamente mais tarde.</Text>
          <Pressable onPress={() => refetch()} style={styles.primaryCta}>
            <Text style={styles.primaryCtaText}>Tentar novamente</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} />
        }
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Os meus imóveis</Text>
            <Text style={styles.subtitle}>
              Moradias, apartamentos, terrenos e prédios organizados num só
              sítio.
            </Text>
          </View>

          <Pressable
            style={styles.addBtn}
            onPress={() => router.push("/property/add-property")}
          >
            <Ionicons name="add" size={18} color="#fff" />
          </Pressable>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color="#777" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Pesquisar imóveis…"
            placeholderTextColor="#999"
            style={styles.search}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={18} color="#999" />
            </Pressable>
          )}
        </View>

        {/* List */}
        {items.length === 0 ? (
          <EmptyState
            title="Sem imóveis ainda"
            message="Cria o teu primeiro imóvel para começares."
            actionText="Adicionar imóvel"
            onAction={() => router.push("/property/add-property")}
          />
        ) : (
          <View style={styles.list}>
            {buildings.map((b) => (
              <BuildingCard
                key={b.id}
                building={b}
                onOpenBuilding={() => router.push(`/property/${b.id}`)}
                onOpenUnit={(unitId) => router.push(`/property/${unitId}`)}
              />
            ))}

            {filteredStandalone.map((p) => (
              <PropertyRow
                key={p.id}
                p={p}
                onPress={() => router.push(`/property/${p.id}`)}
              />
            ))}
          </View>
        )}

        <View style={{ height: 18 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* -----------------------------------------------------
 * Styles
 * ---------------------------------------------------*/

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 16, paddingBottom: 24 },

  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  loadingText: { color: "#666", fontWeight: "800" },

  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  title: { fontSize: 22, fontWeight: "900" },
  subtitle: {
    marginTop: 6,
    color: "#666",
    fontWeight: "700",
    lineHeight: 18,
    fontSize: 13,
  },

  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },

  searchWrap: {
    marginTop: 6,
    borderRadius: 16,
    backgroundColor: "#F7F7F7",
    paddingHorizontal: 12,
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  search: { flex: 1, fontSize: 14, color: "#111" },

  list: { marginTop: 12, gap: 10 },

  /* Generic property row */
  row: {
    borderWidth: 1,
    borderColor: "#EAEAEA",
    borderRadius: 16,
    padding: 14,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { fontSize: 14, fontWeight: "900", color: "#111" },
  rowSubtitle: { marginTop: 3, fontSize: 12, fontWeight: "700", color: "#666" },

  rowMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  metaText: { fontSize: 12, fontWeight: "800", color: "#666" },
  metaStrong: { color: "#111", fontWeight: "900" },
  metaDot: { color: "#CBD5E1", fontWeight: "900" },

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

  /* Building */
  buildingCard: {
    borderWidth: 1,
    borderColor: "#EAEAEA",
    borderRadius: 18,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  buildingHeader: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  buildingIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  buildingMeta: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "800",
    color: "#666",
  },

  unitsList: {
    borderTopWidth: 1,
    borderColor: "#EEE",
  },
  unitRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FAFAFA",
  },
  unitText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    color: "#111",
  },

  emptyBox: {
    marginTop: 12,
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
});
