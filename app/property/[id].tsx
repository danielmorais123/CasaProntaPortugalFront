import React, { useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Alert as AlertModel,
  PermissionLevel,
  PropertyType,
} from "@/types/models";
import { getPropertyById } from "@/hooks/services/property";
import { AuthContext } from "@/context/AuthContext";
import { canEditProperty } from "@/utils/permissions";
import { useQuery } from "@tanstack/react-query";
import * as FileSystem from "expo-file-system";
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
  return d.toLocaleDateString("pt-PT");
}

function permissionLabel(level: PermissionLevel) {
  switch (level) {
    case PermissionLevel.Admin:
      return "Admin";
    case PermissionLevel.Read:
      return "Leitura";
    case PermissionLevel.Temporary:
      return "Temporário";
    default:
      return "—";
  }
}

/* ---------------------------------- */
/* Rows                               */
/* ---------------------------------- */

// function DocumentRow({ d, onPress }: { d: Document; onPress: () => void }) {
//   return (
//     <Pressable onPress={onPress} style={styles.row}>
//       <View style={styles.rowIcon}>
//         <Ionicons name="document-text-outline" size={18} />
//       </View>

//       <View style={{ flex: 1 }}>
//         <Text style={styles.rowTitle} numberOfLines={1}>
//           Documento
//         </Text>
//         <Text style={styles.rowSubtitle} numberOfLines={1}>
//           {d.expirationDate
//             ? `Validade: ${formatDateMaybe(d.expirationDate)}`
//             : "Sem validade"}
//         </Text>
//       </View>

//       <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
//     </Pressable>
//   );
// }

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
          {a.createdAt ? formatDateMaybe(a.createdAt) : "—"}
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

  const [downloading, setDownloading] = useState(false);
  console.log({ FileSystem });
  const {
    data: item,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["property", id],
    queryFn: () => getPropertyById(id!),
    enabled: !!id,
  });

  const handleDownloadAll = async () => {
    if (!item) return;

    try {
      setDownloading(true);

      const safeName = item.name.replace(/\s+/g, "_");

      // WEB → keep existing behavior
      if (Platform.OS === "web") {
        await downloadAllDocuments(item.id, safeName);
        return;
      }

      // MOBILE → native filesystem download
      // const filePath = await downloadAllDocuments(item.id, safeName);
      // console.log("File downloaded to:", filePath);
      Alert.alert(
        "Download concluído",
        Platform.OS === "ios"
          ? "O ficheiro foi guardado na app."
          : "O ficheiro foi guardado em Downloads."
      );
    } catch (e) {
      console.error("Erro ao descarregar documentos:", e);
      Alert.alert("Erro", "Não foi possível descarregar os documentos.");
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading || isFetching || !item) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>A carregar…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const docs = item.documents ?? [];
  const alerts = item.alerts ?? [];
  const permissions = item.permissions ?? [];
  // const units: Property[] = item.units ?? [];
  const isBuilding = item.type === PropertyType.Building;
  const canManage = canEditProperty(user, item);

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

          <View style={{ flex: 1 }} />

          <Pressable
            style={styles.iconBtn}
            onPress={() =>
              router.push({
                pathname: "/property/[id]/documents",
                //@ts-ignore
                params: {
                  propertyId: item.id,
                  propertyType: item.type.toString(),
                },
              })
            }
          >
            <Ionicons name="folder-outline" size={18} />
          </Pressable>
        </View>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.subtitle}>{item.streetName || "—"}</Text>
        <View style={styles.pillsRow}>
          <Pill text={`${docs.length} docs`} />
          <Pill text={`${alerts.length} alertas`} />
          <Pill text={`${permissions.length} acessos`} />
          {isBuilding && <Pill text="Prédio" />}
        </View>
        <View style={styles.statsRow}>
          <StatTile label="Documentos" value={`${docs.length}`} />
          <StatTile label="Alertas" value={`${alerts.length}`} />
          <StatTile label="Acessos" value={`${permissions.length}`} />
        </View>
        {/* DOWNLOAD CARD */}
        {docs.length > 0 && (
          <Pressable
            style={styles.downloadCard}
            onPress={handleDownloadAll}
            disabled={downloading}
          >
            <View style={styles.downloadIcon}>
              <Ionicons name="download-outline" size={22} color="#2563EB" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.downloadTitle}>
                Descarregar todos os documentos
              </Text>
              <Text style={styles.downloadSubtitle}>
                ZIP com todos os documentos deste imóvel
              </Text>
            </View>

            {downloading ? (
              <ActivityIndicator />
            ) : (
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            )}
          </Pressable>
        )}
        {/* DOCUMENTOS */}
        {/* ALERTAS */}
        <Text style={styles.sectionTitle}>Alertas</Text>
        {alerts.length === 0 ? (
          <Text style={styles.helperText}>Sem alertas ativos.</Text>
        ) : (
          <View style={styles.list}>
            {alerts.map((a) => (
              <AlertRow key={a.id} a={a} />
            ))}
          </View>
        )}
        {/* PARTILHAS */}
        <Text style={styles.sectionTitle}>Acessos</Text>
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
        {canManage && (
          <Pressable
            style={styles.secondaryCta}
            onPress={() => router.push(`/property/${item.id}/share`)}
          >
            <Text style={styles.secondaryCtaText}>Gerir acessos</Text>
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

  downloadCard: {
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  downloadIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  downloadTitle: { fontWeight: "900", fontSize: 14 },
  downloadSubtitle: { fontSize: 12, color: "#475569" },

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
