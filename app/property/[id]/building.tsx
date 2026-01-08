import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { getPropertyById } from "@/hooks/services/property";
import { Property, PropertyType } from "@/types/models";

/* ---------------------------------- */
/* Small UI blocks                     */
/* ---------------------------------- */

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

function EmptyBox({
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
        <Pressable style={styles.primaryCta} onPress={onAction}>
          <Text style={styles.primaryCtaText}>{actionText}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function UnitRow({ unit, onPress }: { unit: Property; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name="home-outline" size={18} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {unit.name}
        </Text>
        <Text style={styles.rowSubtitle}>
          {unit.documents?.length ?? 0} documentos
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
    </Pressable>
  );
}

/* ---------------------------------- */
/* Screen                              */
/* ---------------------------------- */

export default function BuildingDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    data: building,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["property", id],
    queryFn: () => getPropertyById(id!),
    enabled: !!id,
  });

  const units = useMemo(() => building?.units ?? [], [building]);
  const documents = building?.documents ?? [];
  const alerts = building?.alerts ?? [];

  if (isLoading || isFetching) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>A carregar prédio…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !building || building.type !== PropertyType.Building) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color="#EF4444" />
          <Text style={styles.emptyTitle}>Prédio não encontrado</Text>
          <Pressable style={styles.primaryCta} onPress={() => router.back()}>
            <Text style={styles.primaryCtaText}>Voltar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} />
        }
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable style={styles.iconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={18} />
          </Pressable>

          <View style={{ flex: 1 }} />

          <Pressable
            style={styles.iconBtn}
            onPress={() =>
              router.push({
                pathname: "/property/[id]/documents",
                //@ts-ignore
                params: {
                  propertyId: building.id,
                  propertyType: PropertyType.Building.toString(),
                },
              })
            }
          >
            <Ionicons name="folder-outline" size={18} />
          </Pressable>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="business-outline" size={22} color="#1D4ED8" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{building.name}</Text>
            <Text style={styles.subtitle}>{building.streetName || "—"}</Text>
          </View>
        </View>

        <View style={styles.pillsRow}>
          <Pill text={`${units.length} frações`} />
          <Pill text={`${documents.length} docs comuns`} />
          <Pill text={`${alerts.length} alertas`} />
        </View>

        {/* DOCUMENTOS DO PRÉDIO
        <SectionHeader
          title="Documentos do prédio"
          actionText="Ver todos"
          onAction={() =>
            router.push({
              pathname: "/property/[id]/documents",
              params: { propertyId: building.id },
            })
          }
        />

        {documents.length === 0 ? (
          <EmptyBox
            title="Sem documentos comuns"
            message="Documentos das partes comuns do prédio (atas, seguro, regulamento, etc.)."
            actionText="Adicionar documentos"
            onAction={() =>
              router.push({
                pathname: "/property/[id]/documents/add-documents",
                params: {
                  propertyId: building.id,
                  propertyType: PropertyType.Building.toString(),
                },
              })
            }
          />
        ) : null} */}

        {/* FRAÇÕES */}
        <SectionHeader
          title="Frações"
          actionText="Adicionar fração"
          onAction={() =>
            router.push({
              pathname: "/property/[id]/add-unit",
              params: { id: building.id },
            })
          }
        />

        {units.length === 0 ? (
          <EmptyBox
            title="Sem frações"
            message="Este prédio ainda não tem frações registadas."
            actionText="Adicionar fração"
            onAction={() =>
              router.push({
                pathname: "/property/[id]/add-unit",
                params: { id: building.id },
              })
            }
          />
        ) : (
          <View style={styles.list}>
            {units.map((u) => (
              <UnitRow
                key={u.id}
                unit={u}
                onPress={() =>
                  router.push({
                    pathname: "/property/[id]",
                    params: { id: u.id },
                  })
                }
              />
            ))}
          </View>
        )}

        {/* ALERTAS */}
        <SectionHeader
          title="Alertas do prédio"
          actionText="Ver alertas"
          onAction={() => router.push("/notifications")}
        />

        {alerts.length === 0 ? (
          <EmptyBox
            title="Sem alertas"
            message="Não existem alertas ativos para este prédio."
          />
        ) : null}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------------------------------- */
/* Styles                              */
/* ---------------------------------- */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 16, paddingBottom: 28 },

  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  loadingText: { fontWeight: "800", color: "#666" },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
  },

  header: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },

  title: { fontSize: 22, fontWeight: "900", color: "#0F172A" },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },

  pillsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 14,
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
  },
  pillText: { fontSize: 12, fontWeight: "800", color: "#0F172A" },

  sectionHeader: {
    marginTop: 16,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { fontSize: 16, fontWeight: "900" },
  sectionAction: { fontSize: 13, fontWeight: "900", color: "#1D4ED8" },

  list: { gap: 10 },

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
  rowSubtitle: { fontSize: 12, fontWeight: "700", color: "#666" },

  emptyBox: {
    borderWidth: 1,
    borderColor: "#EAEAEA",
    borderRadius: 16,
    padding: 14,
    backgroundColor: "#FAFAFA",
  },
  emptyTitle: { fontWeight: "900", fontSize: 14, marginBottom: 6 },
  emptyText: { fontSize: 13, color: "#555", lineHeight: 18 },

  primaryCta: {
    marginTop: 12,
    backgroundColor: "#111",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryCtaText: { color: "#fff", fontWeight: "900" },
});
