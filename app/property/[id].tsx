import React, { useContext, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Document, Alert as AlertModel, PermissionLevel } from "@/types/models";
import { getPropertyById } from "@/hooks/services/property";
import { AuthContext } from "@/context/AuthContext";
import { canEditProperty, canShareProperty } from "@/utils/permissions";
import { ShareProperty } from "@/components/ShareProperty";
import { useQuery } from "@tanstack/react-query";

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

function docTypeLabel(type: number) {
  // Mostra algo legível sem depender de map completo
  // Se quiseres, eu faço um map completo para todos os DocumentType.
  switch (type) {
    case 1:
      return "Caderneta Predial";
    case 2:
      return "Certidão Permanente";
    case 3:
      return "Escritura / Título";
    case 4:
      return "Licença / Isenção";
    case 5:
      return "Certificado Energético";
    case 9:
      return "Comprovativo IMI";
    case 20:
      return "Contrato Arrendamento";
    case 40:
      return "Planta Localização";
    case 60:
      return "Regulamento Condomínio";
    case 61:
      return "Atas Condomínio";
    default:
      return "Documento";
  }
}

function formatDateMaybe(iso?: string) {
  if (!iso) return "";
  // tenta YYYY-MM-DD ou ISO completo
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-PT");
}

function DocumentRow({ d, onPress }: { d: Document; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name="document-text-outline" size={18} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {docTypeLabel(d.type)}
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

function AlertRow({ a, onPress }: { a: AlertModel; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name="alert-circle-outline" size={18} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {a.message}
        </Text>
        <Text style={styles.rowSubtitle} numberOfLines={1}>
          {a.date ? formatDateMaybe(a.date) : "—"}
        </Text>
      </View>

      <Text style={styles.rowChevron}>›</Text>
    </Pressable>
  );
}
function SectionHeader({
  title,
  actionText,
  onAction,
  disabled,
  secondaryText,
  onSecondaryAction,
}: {
  title: string;
  actionText?: string;
  onAction?: () => void;
  disabled?: boolean;
  secondaryText?: string;
  onSecondaryAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        {secondaryText && onSecondaryAction ? (
          <Pressable onPress={onSecondaryAction} hitSlop={10}>
            <Text style={styles.upgradeCta}>{secondaryText}</Text>
          </Pressable>
        ) : null}

        {actionText ? (
          <Pressable
            onPress={disabled ? undefined : onAction}
            hitSlop={10}
            disabled={disabled}
          >
            <Text
              style={[styles.sectionAction, disabled && styles.actionDisabled]}
            >
              {actionText}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
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

export default function PropertyDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = String(params.id ?? "");

  const { user } = useContext(AuthContext);
  const [shareOpen, setShareOpen] = useState(false);

  // React Query for property
  const {
    data: item,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["property", id],
    queryFn: () => getPropertyById(id),
    enabled: !!id,
  });

  const canManagePermissions = canEditProperty(user, item);
  const canShare = canShareProperty(user, item);
  const shareDisabled = !canShare;
  const showManage = canManagePermissions;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const docs = item?.documents ?? [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const alerts = item?.alerts ?? [];
  const permissions = item?.permissions ?? [];

  const docsPreview = useMemo(() => docs.slice(0, 4), [docs]);
  const alertsPreview = useMemo(() => alerts.slice(0, 3), [alerts]);

  const onRefresh = async () => {
    await refetch();
  };

  if (isLoading || isFetching) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>A carregar imóvel…</Text>
        </View>
      </SafeAreaView>
    );
  }
  if (error || !item) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={[styles.container, { justifyContent: "center", flex: 1 }]}>
          <Text style={styles.title}>Imóvel não encontrado</Text>
          <Text style={styles.subtitle}>
            Tenta voltar atrás e abrir novamente.
          </Text>

          <Pressable style={styles.primaryCta} onPress={() => router.back()}>
            <Text style={styles.primaryCtaText}>Voltar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  function onUpgrade(): void {
    // Redirect user to the upgrade or subscription page
    router.push("/profile/plans-help");
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={onRefresh} />
        }
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable
            style={styles.iconBtn}
            onPress={() => router.back()}
            hitSlop={10}
          >
            <Ionicons name="arrow-back" size={18} />
          </Pressable>

          <View style={{ flex: 1 }} />

          <Pressable
            style={styles.iconBtn}
            onPress={() =>
              router.push({
                pathname: "/property/add-documents",
                params: { propertyId: item.id },
              })
            }
            hitSlop={10}
          >
            <Ionicons name="cloud-upload-outline" size={18} />
          </Pressable>

          <Pressable
            style={styles.iconBtn}
            onPress={() =>
              router.push({
                pathname: "/property/[id]",
                params: { id: item.id },
              })
            }
            hitSlop={10}
          >
            <Ionicons name="create-outline" size={18} />
          </Pressable>
        </View>

        {/* Header */}
        <Text style={styles.title} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          {item.streetName || "—"}
        </Text>

        <View style={styles.pillsRow}>
          <Pill text={`${docs.length} docs`} />
          <Pill text={`${alerts.length} alertas`} />
          <Pill text={`${permissions.length} partilhas`} />
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatTile label="Documentos" value={`${docs.length}`} />
          <StatTile label="Alertas" value={`${alerts.length}`} />
          <StatTile label="Partilhas" value={`${permissions.length}`} />
        </View>

        {/* Documentos */}
        <SectionHeader
          title="Documentos"
          actionText={docs.length > 0 ? "Ver todos" : undefined}
          onAction={
            docs.length > 0
              ? () =>
                  router.push({
                    pathname: "/property/add-documents",
                    params: { propertyId: item.id },
                  })
              : undefined
          }
        />

        {docs.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>Sem documentos</Text>
            <Text style={styles.emptyText}>
              Faz upload de PDFs/imagens para começares a organizar este imóvel.
            </Text>
            <Pressable
              style={styles.primaryCta}
              onPress={() =>
                router.push({
                  pathname: "/property/[id]/documents/add-documents",
                  params: { propertyId: item.id, propertyType: item.type },
                })
              }
            >
              <Text style={styles.primaryCtaText}>Fazer upload</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.list}>
            {docsPreview.map((d) => (
              <DocumentRow
                key={d.id}
                d={d}
                onPress={() =>
                  router.push({
                    pathname: "/property/[id]/documents/[documentId]",
                    params: { propertyId: item.id, documentId: d.id },
                  })
                }
              />
            ))}

            {docs.length > docsPreview.length ? (
              <Pressable
                style={styles.secondaryCta}
                onPress={() =>
                  router.push({
                    pathname: "/documents",
                    params: { propertyId: item.id },
                  })
                }
              >
                <Text style={styles.secondaryCtaText}>
                  Ver todos os documentos
                </Text>
              </Pressable>
            ) : null}
          </View>
        )}

        {/* Alertas */}
        <SectionHeader
          title="Alertas"
          actionText={alerts.length > 0 ? "Ver todos" : undefined}
          onAction={
            alerts.length > 0 ? () => router.push("/notifications") : undefined
          }
        />

        {alerts.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>Sem alertas</Text>
            <Text style={styles.emptyText}>
              Não há alertas ativos para este imóvel.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {alertsPreview.map((a) => (
              <AlertRow
                key={a.id}
                a={a}
                onPress={() =>
                  router.push({
                    pathname: "/notifications",
                    params: { id: a.id },
                  })
                }
              />
            ))}

            {alerts.length > alertsPreview.length ? (
              <Pressable
                style={styles.secondaryCta}
                onPress={() => router.push("/notifications")}
              >
                <Text style={styles.secondaryCtaText}>
                  Ver todos os alertas
                </Text>
              </Pressable>
            ) : null}
          </View>
        )}

        <SectionHeader
          title="Partilhas"
          actionText={showManage ? "Partilhar este imóvel" : undefined}
          onAction={() =>
            router.push({
              pathname: "/property/[id]/share",
              params: { id: item.id },
            })
          }
          disabled={showManage ? shareDisabled : undefined}
          secondaryText={showManage && shareDisabled ? "Upgrade" : undefined}
          onSecondaryAction={
            showManage && shareDisabled ? onUpgrade : undefined
          }
        />

        {permissions.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>Sem partilhas</Text>
            <Text style={styles.emptyText}>
              Convida alguém para ver ou gerir este imóvel.
            </Text>
            <Pressable
              style={[
                styles.secondaryCta,
                showManage && shareDisabled ? styles.disabledCta : null,
              ]}
              disabled={!showManage || shareDisabled}
              onPress={() =>
                router.push({
                  pathname: "/property/[id]/share",
                  params: { id: item.id },
                })
              }
            >
              <Text style={styles.secondaryCtaText}>
                {showManage ? "Partilhar este imóvel" : "Sem permissão"}
              </Text>
            </Pressable>
            {showManage && shareDisabled ? (
              <Pressable style={styles.upgradeBtn} onPress={onUpgrade}>
                <Text style={styles.upgradeBtnText}>
                  Fazer upgrade para partilhar
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <View style={styles.list}>
            {permissions.slice(0, 3).map((perm) => (
              <View key={String(perm.id)} style={styles.permissionRow}>
                <View style={styles.permissionIcon}>
                  <Ionicons name="people-outline" size={18} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {perm.user?.email ?? "Utilizador"}
                  </Text>
                  <Text style={styles.rowSubtitle} numberOfLines={1}>
                    {permissionLabel(perm.permissionLevel)}
                    {perm.expiresAt
                      ? ` • expira ${formatDateMaybe(perm.expiresAt)}`
                      : ""}
                  </Text>
                </View>
              </View>
            ))}

            <Pressable
              style={styles.secondaryCta}
              onPress={() => setShareOpen(true)}
            >
              <Text style={styles.secondaryCtaText}>Partilhar este imóvel</Text>
            </Pressable>
          </View>
        )}

        <View style={{ height: 18 }} />
      </ScrollView>

      {/* Modal de partilha */}
      <Modal
        visible={shareOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setShareOpen(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 18,
              padding: 18,
              width: "100%",
              maxWidth: 400,
            }}
          >
            <Text
              style={{ fontWeight: "bold", fontSize: 18, marginBottom: 12 }}
            >
              Partilhar este imóvel
            </Text>
            <ShareProperty propertyId={item.id} />
            <Pressable
              style={[
                styles.primaryCta,
                { marginTop: 18, backgroundColor: "#eee" },
              ]}
              onPress={() => setShareOpen(false)}
            >
              <Text style={[styles.primaryCtaText, { color: "#111" }]}>
                Fechar
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actionDisabled: { color: "#BDBDBD" },

  disabledCta: { opacity: 0.5 },

  upgradeCta: { fontSize: 13, fontWeight: "900", color: "#B8860B" }, // dourado

  upgradeBtn: {
    marginTop: 10,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#B8860B",
  },
  upgradeBtnText: { color: "#111", fontWeight: "900" },

  safe: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 16, paddingBottom: 24 },

  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  loadingText: { color: "#666", fontWeight: "800" },

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

  title: { fontSize: 22, fontWeight: "900" },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: "#666",
    fontWeight: "700",
    lineHeight: 18,
  },

  pillsRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 12 },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#F2F2F2",
  },
  pillText: { fontSize: 12, fontWeight: "800", color: "#111" },

  statsRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  statTile: { flex: 1, borderRadius: 16, backgroundColor: "#111", padding: 14 },
  statValue: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 18,
    marginBottom: 2,
  },
  statLabel: { color: "#CFCFCF", fontSize: 12, fontWeight: "800" },

  sectionHeader: {
    marginTop: 16,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { fontSize: 16, fontWeight: "900" },
  sectionAction: { fontSize: 13, fontWeight: "900", color: "#111" },

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
  rowSubtitle: { marginTop: 3, fontSize: 12, fontWeight: "700", color: "#666" },
  rowChevron: { fontSize: 20, fontWeight: "900", color: "#999" },

  permissionRow: {
    borderWidth: 1,
    borderColor: "#EAEAEA",
    borderRadius: 16,
    padding: 14,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  permissionIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
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

  secondaryCta: {
    borderWidth: 1,
    borderColor: "#EAEAEA",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  secondaryCtaText: { fontWeight: "900", color: "#111" },
});
