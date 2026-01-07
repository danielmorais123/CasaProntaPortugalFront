import React, { useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Document,
  Alert as AlertModel,
  PermissionLevel,
  PropertyType,
  Property,
} from "@/types/models";
import { getPropertyById } from "@/hooks/services/property";
import { AuthContext } from "@/context/AuthContext";
import { canEditProperty, canShareProperty } from "@/utils/permissions";
import { useQuery } from "@tanstack/react-query";

/* ---------------------------------- */
/* Helpers                            */
/* ---------------------------------- */

function Pill({ text }: { text: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>{text}</Text>
    </View>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function formatDateMaybe(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-PT");
}

function permissionLabel(level: PermissionLevel) {
  switch (level) {
    case "Admin":
      return "Admin";
    case "Read":
      return "Leitura";
    case "Temporary":
      return "Temporário";
    default:
      return "—";
  }
}

/* ---------------------------------- */
/* Rows                               */
/* ---------------------------------- */

function DocumentRow({ d, onPress }: { d: Document; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name="document-text-outline" size={18} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          Documento
        </Text>
        <Text style={styles.rowSubtitle} numberOfLines={1}>
          {d.expirationDate
            ? `Validade: ${formatDateMaybe(d.expirationDate)}`
            : "Sem validade"}
        </Text>
      </View>

      <Text style={styles.rowChevron}>›</Text>
    </Pressable>
  );
}

function AlertRow({ a }: { a: AlertModel }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name="alert-circle-outline" size={18} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {a.message}
        </Text>
        <Text style={styles.rowSubtitle}>
          {a.date ? formatDateMaybe(a.date) : "—"}
        </Text>
      </View>
    </View>
  );
}

/* ---------------------------------- */
/* Main Screen                        */
/* ---------------------------------- */

export default function PropertyDetailScreen() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    data: item,
    isLoading,
    isFetching,
    refetch,
    error,
  } = useQuery({
    queryKey: ["property", id],
    queryFn: () => getPropertyById(id!),
    enabled: !!id,
  });

  if (isLoading || isFetching) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>A carregar…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !item) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.title}>Imóvel não encontrado</Text>
          <Pressable onPress={() => router.back()} style={styles.primaryCta}>
            <Text style={styles.primaryCtaText}>Voltar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isBuilding = item.type === PropertyType.Building;

  const docs = item.documents ?? [];
  const alerts = item.alerts ?? [];
  const permissions = item.permissions ?? [];
  const units: Property[] = item.units ?? [];

  const canManage = canEditProperty(user, item);
  const canShare = canShareProperty(user, item);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} />
        }
      >
        {/* Header */}
        <View style={styles.topBar}>
          <Pressable style={styles.iconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={18} />
          </Pressable>
        </View>

        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.subtitle}>{item.streetName || "—"}</Text>

        <View style={styles.pillsRow}>
          <Pill text={`${docs.length} docs`} />
          <Pill text={`${alerts.length} alertas`} />
          <Pill text={`${permissions.length} partilhas`} />
          {isBuilding && <Pill text="Prédio / Condomínio" />}
        </View>

        <View style={styles.statsRow}>
          <StatTile label="Documentos" value={`${docs.length}`} />
          <StatTile label="Alertas" value={`${alerts.length}`} />
          <StatTile label="Acessos" value={`${permissions.length}`} />
        </View>

        {/* ================= PRÉDIO ================= */}
        {isBuilding && (
          <>
            <Text style={styles.sectionTitle}>Frações</Text>
            {units.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>Sem frações</Text>
                <Text style={styles.emptyText}>
                  Este prédio ainda não tem frações associadas.
                </Text>
                <Pressable
                  style={styles.primaryCta}
                  onPress={() => router.push(`/property/${id}/add-unit`)}
                >
                  <Text style={styles.primaryCtaText}>Adicionar fração</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.list}>
                {units.map((u) => (
                  <Pressable
                    key={u.id}
                    style={styles.row}
                    onPress={() => router.push(`/property/${u.id}`)}
                  >
                    <View style={styles.rowIcon}>
                      <Ionicons name="business-outline" size={18} />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>{u.name}</Text>
                      <Text style={styles.rowSubtitle}>
                        {u.documents?.length ?? 0} docs •{" "}
                        {u.alerts?.length ?? 0} alertas
                      </Text>
                    </View>

                    <Text style={styles.rowChevron}>›</Text>
                  </Pressable>
                ))}
              </View>
            )}

            <Text style={styles.sectionTitle}>Documentos do edifício</Text>
            <Text style={styles.helperText}>
              Partes comuns, condomínio, seguros, atas, etc.
            </Text>
          </>
        )}

        {/* ================= DOCUMENTOS ================= */}
        <View style={styles.list}>
          {docs.map((d) => (
            <DocumentRow
              key={d.id}
              d={d}
              onPress={() =>
                router.push(`/property/${item.id}/documents/${d.id}`)
              }
            />
          ))}
        </View>

        {/* ================= ALERTAS ================= */}
        <Text style={styles.sectionTitle}>Alertas</Text>
        {alerts.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Sem alertas ativos.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {alerts.map((a) => (
              <AlertRow key={a.id} a={a} />
            ))}
          </View>
        )}

        {/* ================= PARTILHAS ================= */}
        <Text style={styles.sectionTitle}>
          {isBuilding ? "Acessos ao edifício" : "Partilhas"}
        </Text>

        {permissions.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              Ainda não existem permissões atribuídas.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {permissions.map((p) => (
              <View key={p.id} style={styles.row}>
                <View style={styles.rowIcon}>
                  <Ionicons name="people-outline" size={18} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>
                    {p.user?.email ?? "Utilizador"}
                  </Text>
                  <Text style={styles.rowSubtitle}>
                    {permissionLabel(p.permissionLevel)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {canManage && (
          <Pressable
            style={styles.secondaryCta}
            onPress={() => router.push(`/property/${item.id}/share`)}
          >
            <Text style={styles.secondaryCtaText}>Gerir partilhas</Text>
          </Pressable>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------------------------------- */
/* Styles                             */
/* ---------------------------------- */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 16, paddingBottom: 24 },

  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  loadingText: { fontWeight: "700", color: "#666" },

  topBar: { flexDirection: "row", marginBottom: 8 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
  },

  title: { fontSize: 22, fontWeight: "900" },
  subtitle: { marginTop: 4, fontSize: 13, color: "#666", fontWeight: "700" },

  pillsRow: { flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#F2F2F2",
  },
  pillText: { fontSize: 12, fontWeight: "800" },

  statsRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  statTile: { flex: 1, borderRadius: 16, backgroundColor: "#111", padding: 14 },
  statValue: { color: "#fff", fontSize: 18, fontWeight: "900" },
  statLabel: { color: "#CFCFCF", fontSize: 12, fontWeight: "800" },

  sectionTitle: {
    marginTop: 18,
    marginBottom: 6,
    fontSize: 16,
    fontWeight: "900",
  },
  helperText: { fontSize: 12, color: "#64748B", marginBottom: 8 },

  list: { gap: 10 },

  row: {
    borderWidth: 1,
    borderColor: "#EAEAEA",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { fontSize: 14, fontWeight: "900" },
  rowSubtitle: { fontSize: 12, color: "#666", fontWeight: "700" },
  rowChevron: { fontSize: 20, fontWeight: "900", color: "#999" },

  emptyBox: {
    borderWidth: 1,
    borderColor: "#EAEAEA",
    borderRadius: 16,
    padding: 14,
    backgroundColor: "#FAFAFA",
  },
  emptyTitle: { fontWeight: "900", marginBottom: 4 },
  emptyText: { color: "#555", fontSize: 13 },

  primaryCta: {
    marginTop: 12,
    backgroundColor: "#111",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryCtaText: { color: "#fff", fontWeight: "900" },

  secondaryCta: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryCtaText: { fontWeight: "900" },
});
