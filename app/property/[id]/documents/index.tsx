import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";

import {
  getDocumentsByPropertyId,
  getSuggestionsByPropertyType,
} from "@/hooks/services/document";

import { DocumentType, DocumentTypeName, Document } from "@/types/models";
import { propertyTypeFromString, propertyTypeToString } from "@/utils/property";
import { api } from "@/hooks/services/api";
import { getExpirationStatus } from "@/utils/document";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type SuggestedDoc = {
  type: DocumentType;
  title: string;
};

/* -------------------------------------------------------------------------- */
/* SCREEN                                                                     */
/* -------------------------------------------------------------------------- */

export default function PropertyDocumentsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    propertyId: string;
    propertyType: string;
  }>();

  const propertyId = params.propertyId;
  const propertyType = propertyTypeFromString(params.propertyType);
  console.log({ propertyId, propertyType });
  /* ---------------------------- EXISTING DOCS ----------------------------- */
  const {
    data: documents = [],
    isLoading: docsLoading,
    isFetching: docsFetching,
    refetch: refetchDocs,
  } = useQuery<Document[]>({
    queryKey: ["documents", propertyId],
    queryFn: () => getDocumentsByPropertyId(propertyId!),
    enabled: !!propertyId,
  });
  console.log({ documents });
  /* ---------------------------- SUGGESTIONS -------------------------------- */
  const {
    data: suggestionsRaw = [],
    isLoading: suggestionsLoading,
    refetch: refetchSuggestions,
  } = useQuery<SuggestedDoc[]>({
    queryKey: ["suggestions", propertyTypeToString(propertyType)],
    queryFn: async () => {
      console.log("PropertyType", propertyType);
      const types = await getSuggestionsByPropertyType(propertyType!);
      return types.map((t) => ({
        type: t,
        title: DocumentTypeName[t as DocumentType] || "Documento",
      }));
    },
    enabled: !!propertyType,
  });

  /* ----------------------- FILTER SUGGESTIONS ------------------------------ */
  const suggestions = useMemo(() => {
    const existingTypes = new Set(documents.map((d) => d.type));
    return suggestionsRaw.filter((s) => !existingTypes.has(s.type));
  }, [documents, suggestionsRaw]);

  const isLoading = docsLoading || suggestionsLoading;
  const isFetching = docsFetching;

  const onRefresh = useCallback(async () => {
    await Promise.all([refetchDocs(), refetchSuggestions()]);
  }, [refetchDocs, refetchSuggestions]);

  const handleUploadForDoc = async (doc: SuggestedDoc) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const file = result.assets?.[0];
      if (!file) return;

      // Prepare FormData for backend upload
      const form = new FormData();
      form.append("PropertyId", propertyId);
      form.append("Type", String(doc.type));
      form.append("file", {
        uri: file.uri,
        name: file.name ?? "document.pdf",
        type: file.mimeType ?? "application/pdf",
      } as any);

      // Call your API (adjust endpoint if needed)
      await api.post("/document/upload", form);

      // Optionally, refetch documents after upload
      refetchDocs();
    } catch (e) {
      // Handle error (show toast, etc)
      console.error(e);
    }
  };
  /* ------------------------------------------------------------------------ */

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={styles.screenTitle}>Documentos do imóvel</Text>
          <Text style={styles.screenSubtitle}>
            {documents.length} carregados • {suggestions.length} em falta
          </Text>
        </View>
      </View>
      <CompletionBar
        current={documents.length}
        total={documents.length + suggestions.length}
      />

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>A carregar documentos…</Text>
        </View>
      ) : (
        <FlatList
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={onRefresh} />
          }
          data={[{ key: "uploaded" }, { key: "suggested" }]}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => {
            if (item.key === "uploaded") {
              return (
                <Section
                  title="Já carregados"
                  emptyText="Ainda não tens documentos neste imóvel."
                >
                  {documents.map((doc) => (
                    <Pressable
                      key={doc.id}
                      style={styles.card}
                      onPress={() =>
                        router.push({
                          pathname: "/property/[id]/documents/[documentId]",
                          params: {
                            propertyId: doc.propertyId,
                            documentId: doc.id,
                          },
                        })
                      }
                    >
                      <View style={styles.iconWrap}>
                        <Ionicons
                          name="document-text-outline"
                          size={20}
                          color="#2563EB"
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>
                          {DocumentTypeName[doc.type]}
                        </Text>
                        <Text style={styles.cardMeta}>
                          {doc.extractionConfidence
                            ? "Analisado por IA"
                            : "Sem análise IA"}
                        </Text>
                        {(() => {
                          const status = getExpirationStatus(
                            doc.expirationDate
                          );

                          if (!status) return null;

                          return (
                            <View
                              style={[
                                styles.expiryBadge,
                                status === "expired"
                                  ? styles.expired
                                  : styles.expiringSoon,
                              ]}
                            >
                              <Ionicons
                                name="alert-circle"
                                size={12}
                                color={
                                  status === "expired" ? "#991B1B" : "#92400E"
                                }
                              />
                              <Text
                                style={[
                                  styles.expiryText,
                                  status === "expired"
                                    ? styles.expiredText
                                    : styles.expiringSoonText,
                                ]}
                              >
                                {status === "expired"
                                  ? "Expirado"
                                  : "Expira em breve"}
                              </Text>
                            </View>
                          );
                        })()}
                      </View>

                      {doc.extractedFields && (
                        <View style={styles.aiBadge}>
                          <Ionicons name="sparkles" size={12} color="#047857" />
                          <Text style={styles.aiBadgeText}>IA</Text>
                        </View>
                      )}
                    </Pressable>
                  ))}
                </Section>
              );
            }

            return (
              <Section
                title="Sugestões"
                emptyText="Este imóvel já tem todos os documentos recomendados."
              >
                {suggestions.map((s, idx) => (
                  <Pressable
                    key={`${s.type}-${idx}`}
                    style={[styles.card, styles.cardGhost]}
                    onPress={() => handleUploadForDoc(s)}
                  >
                    <View style={styles.iconWrapGhost}>
                      <Ionicons
                        name="add-circle-outline"
                        size={22}
                        color="#64748B"
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{s.title}</Text>
                      <Text style={styles.cardMeta}>Documento recomendado</Text>
                    </View>

                    <Text style={styles.addText}>Adicionar</Text>
                  </Pressable>
                ))}
              </Section>
            );
          }}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

function CompletionBar({ current, total }: { current: number; total: number }) {
  const progress = total === 0 ? 0 : current / total;

  return (
    <View style={styles.completionWrap}>
      <View style={styles.completionHeader}>
        <Text style={styles.completionText}>
          {current} / {total} documentos
        </Text>
        <Text style={styles.completionPercent}>
          {Math.round(progress * 100)}%
        </Text>
      </View>

      <View style={styles.progressBarBg}>
        <View
          style={[styles.progressBarFill, { width: `${progress * 100}%` }]}
        />
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* SECTION COMPONENT                                                          */
/* -------------------------------------------------------------------------- */

function Section({
  title,
  emptyText,
  children,
}: {
  title: string;
  emptyText: string;
  children: React.ReactNode[];
}) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={styles.sectionTitle}>{title}</Text>

      {children.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>{emptyText}</Text>
        </View>
      ) : (
        children
      )}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* STYLES                                                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  topBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  screenSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#6B7280",
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },

  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: { color: "#6B7280", fontSize: 13 },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 10,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 10,
  },
  cardGhost: {
    backgroundColor: "#F8FAFC",
    borderStyle: "dashed",
  },

  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapGhost: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },

  cardTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A",
  },
  cardMeta: {
    marginTop: 3,
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },

  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#047857",
  },

  addText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#2563EB",
  },

  emptyBox: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FAFAFA",
  },
  emptyText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },
  completionWrap: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  completionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  completionText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A",
  },
  completionPercent: {
    fontSize: 12,
    fontWeight: "800",
    color: "#2563EB",
  },
  progressBarBg: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#2563EB",
  },

  expiryBadge: {
    marginTop: 6,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },

  expired: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FCA5A5",
  },
  expiredText: {
    color: "#991B1B",
    fontWeight: "900",
    fontSize: 11,
  },

  expiringSoon: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FCD34D",
  },
  expiringSoonText: {
    color: "#92400E",
    fontWeight: "900",
    fontSize: 11,
  },
});
