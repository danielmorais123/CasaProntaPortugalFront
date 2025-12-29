import React, { useEffect, useMemo, useState } from "react";
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
import { Property /*, PropertyType */ } from "@/types/models";
import { getAllProperties } from "@/hooks/services/property"; // <-- use the service

function Pill({
  text,
  active,
  onPress,
}: {
  text: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.pill, active && styles.pillActive]}
      disabled={!onPress}
    >
      <Text style={[styles.pillText, active && styles.pillTextActive]}>
        {text}
      </Text>
    </Pressable>
  );
}

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

export default function PropertiesScreen() {
  const router = useRouter();

  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [query, setQuery] = useState("");

  // filtros (opcional) — só liga se adicionares `type` ao Property
  // const [filter, setFilter] = useState<"all" | PropertyType>("all");

  const fetchAll = async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      const res = await getAllProperties(); // <-- use the service
      setItems(res.items ?? []); // getAllProperties returns a paged result
    } catch {
      // não rebenta UI; mantém items antigos
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll(false);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAll(true);
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = items;

    // filtro por tipo (opcional)
    // if (filter !== "all") list = list.filter((p) => p.type === filter);

    if (!q) return list;

    return list.filter((p) => {
      const n = (p.name ?? "").toLowerCase();
      const s = (p.streetName ?? "").toLowerCase();
      return n.includes(q) || s.includes(q);
    });
  }, [items, query /*, filter*/]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>A carregar imóveis…</Text>
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
            <Text style={styles.title}>Os meus imóveis</Text>
            <Text style={styles.subtitle}>
              Todos os imóveis num só sítio. Pesquisa, entra e gere documentos e
              alertas.
            </Text>
          </View>

          <Pressable
            style={styles.addBtn}
            onPress={() => router.push("/property/add-property")}
            hitSlop={10}
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
            placeholder="Pesquisar por nome ou rua…"
            placeholderTextColor="#999"
            style={styles.search}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery("")} hitSlop={10}>
              <Ionicons name="close-circle" size={18} color="#999" />
            </Pressable>
          ) : null}
        </View>

        {/* Filters (opcional) */}
        {/*
        <View style={styles.filters}>
          <Pill text="Todos" active={filter === "all"} onPress={() => setFilter("all")} />
          <Pill text="Moradia" active={filter === PropertyType.House} onPress={() => setFilter(PropertyType.House)} />
          <Pill text="Apartamento" active={filter === PropertyType.Apartment} onPress={() => setFilter(PropertyType.Apartment)} />
          <Pill text="Terreno" active={filter === PropertyType.Land} onPress={() => setFilter(PropertyType.Land)} />
          <Pill text="Prédio" active={filter === PropertyType.Building} onPress={() => setFilter(PropertyType.Building)} />
          <Pill text="Fração" active={filter === PropertyType.Unit} onPress={() => setFilter(PropertyType.Unit)} />
        </View>
        */}

        {/* List */}
        {items.length === 0 ? (
          <EmptyState
            title="Sem imóveis ainda"
            message="Cria o teu primeiro imóvel para começares a organizar documentação e receber alertas."
            actionText="Adicionar imóvel"
            onAction={() => router.push("/property/add-property")}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Sem resultados"
            message="Não encontrei imóveis com esse termo. Tenta outra pesquisa."
          />
        ) : (
          <View style={styles.list}>
            {filtered.map((p) => (
              <PropertyRow
                key={p.id?.toString() ?? p.name}
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

  filters: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 10 },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#F2F2F2",
  },
  pillActive: { backgroundColor: "#111" },
  pillText: { fontSize: 12, fontWeight: "800", color: "#111" },
  pillTextActive: { color: "#fff" },

  list: { marginTop: 12, gap: 10 },

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
    flexWrap: "wrap",
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
