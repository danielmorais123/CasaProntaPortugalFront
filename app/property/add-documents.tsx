import React, { useCallback, useContext, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getSuggestionsByPropertyType } from "@/hooks/services/document";
import { DocumentType, DocumentTypeName, PropertyType } from "@/types/models";
import { useQuery } from "@tanstack/react-query";

import { api } from "@/hooks/services/api";
import { Alert } from "@/components/Alert";
import { Button } from "@/components/Button";
import { AuthContext } from "@/context/AuthContext";
import { propertyTypeFromString } from "@/utils/property";
import { documentTypeToId } from "@/utils/document";

type DocumentScope = string;

type SuggestedDoc = {
  type: DocumentType;
  title: string;
  description?: string;
  category?: string;
  scope?: DocumentScope;
};

type PlanCode =
  | "free"
  | "starter"
  | "pro"
  | "business"
  | "portfolio"
  | "enterprise";

type PlanInfo = {
  plan: PlanCode;
  canEncrypt: boolean;
  canUploadViaBackend: boolean;
  maxFileSize: number;
};

export default function DocumentUploadSuggestionsScreen() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const params = useLocalSearchParams<{
    propertyId: string;
    propertyType: string;
  }>();

  const propertyId = params.propertyId;
  const propertyType = propertyTypeFromString(params.propertyType);

  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const planInfo: PlanInfo = useMemo(() => {
    const planCode = user?.plan?.code || "free";
    const normalized = String(planCode)?.toLowerCase();
    const canEncrypt =
      normalized === "business" ||
      normalized === "portfolio" ||
      normalized === "enterprise";
    return {
      plan: normalized as PlanCode,
      canEncrypt,
      canUploadViaBackend: canEncrypt,
      maxFileSize: canEncrypt ? 25 * 1024 * 1024 : 5 * 1024 * 1024,
    };
  }, [user]);

  // React Query for suggestions
  const {
    data: suggestions = [],
    isLoading,
    isFetching,
    error: queryError,
    refetch,
  } = useQuery<SuggestedDoc[]>({
    queryKey: ["suggestions", propertyType, propertyId],
    queryFn: async () => {
      if (!propertyId) return [];
      const data: number[] = await getSuggestionsByPropertyType(propertyType!);
      return data.map((typeNum) => ({
        type: typeNum,
        title: DocumentTypeName[typeNum as DocumentType] || "Documento",
      }));
    },
    enabled: !!propertyId,
  });

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const pickFile = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      multiple: false,
      copyToCacheDirectory: true,
    });

    if (result.canceled) return null;
    return result.assets?.[0] ?? null;
  }, []);

  const uploadForSuggestion = useCallback(
    async (s: SuggestedDoc) => {
      if (!propertyId || !planInfo) return;

      setUploadingType(s.type);
      setError(null);

      try {
        const file = await pickFile();
        if (!file) return;

        if (file.size && file.size > planInfo.maxFileSize) {
          setError(
            `Este documento excede ${
              planInfo.maxFileSize / (1024 * 1024)
            } MB. Por favor reduz o tamanho e tenta novamente.`
          );
          return;
        }

        if (planInfo.canUploadViaBackend) {
          const form = new FormData();
          // Fetch the file as a blob
          const fileBlob = await fetch(file.uri).then((res) => res.blob());
          form.append("file", fileBlob, file.name);

          form.append("PropertyId", propertyId);
          form.append("Type", String(documentTypeToId(s.type)));
          if (s.category) form.append("Category", s.category);

          await api.post(`/api/document/upload`, form, {
            headers: { "Content-Type": "multipart/form-data" },
          });

          router.back();
          return;
        }

        const uploadReq = {
          propertyId,
          type: s.type,
          category: s.category ?? null,
          fileName: file.name,
          contentType: file.mimeType ?? "application/octet-stream",
          expirationDate: null,
          issuedBy: null,
          issueDate: null,
          referenceNumber: null,
        };

        const presigned = await api.post(`/api/document/upload-url`, uploadReq);
        const { uploadUrl, documentId } = presigned.data;

        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": uploadReq.contentType,
          },
          body: await (await fetch(file.uri)).blob(),
        });

        await api.post(`/api/document/${documentId}/confirm-upload`, {
          documentId,
          uploadSuccessful: uploadRes.ok,
        });

        if (!uploadRes.ok) {
          setError("Falha no upload do ficheiro. Tenta novamente.");
          return;
        }

        router.back();
      } catch (e: any) {
        setError(e?.message || "Falha ao fazer upload.");
      } finally {
        setUploadingType(null);
      }
    },
    [planInfo, pickFile, propertyId, router]
  );

  const iconForDoc = (title: string) => {
    if (!title) return "document-outline";
    const t = title?.toLowerCase();
    if (t.includes("certificado")) return "flash-outline";
    if (t.includes("caderneta")) return "file-tray-full-outline";
    if (t.includes("escritura")) return "document-text-outline";
    if (t.includes("planta")) return "map-outline";
    if (t.includes("arrendamento")) return "people-outline";
    return "document-outline";
  };

  const headerSubtitle = useMemo(() => {
    const planLabel =
      planInfo?.plan === "business" ||
      planInfo?.plan === "portfolio" ||
      planInfo?.plan === "enterprise"
        ? "Upload premium (mais seguro)"
        : "Upload standard";

    return `${planLabel} • Limite 25 MB`;
  }, [planInfo?.plan]);

  const renderItem = ({ item }: { item: SuggestedDoc }) => {
    const isUploading = uploadingType === item.type;

    return (
      <View style={styles.itemCard}>
        <Pressable
          onPress={() => uploadForSuggestion(item)}
          style={styles.itemRow}
        >
          <View style={styles.itemIcon}>
            <Ionicons name={iconForDoc(item.title)} size={18} color="#2563EB" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemMeta}>
              {DocumentTypeName[item.type as DocumentType] ||
                `Tipo ${item.type}`}
            </Text>
          </View>

          <View style={styles.itemActions}>
            <View
              style={[
                styles.uploadChip,
                isUploading && styles.uploadChipDisabled,
              ]}
            >
              {isUploading ? (
                <ActivityIndicator size="small" />
              ) : (
                <Text style={styles.uploadChipText}>Upload</Text>
              )}
            </View>

            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </View>
        </Pressable>
      </View>
    );
  };

  if (!propertyId) {
    return (
      <SafeAreaView style={styles.container}>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <Ionicons name="alert-circle-outline" size={40} color="#F87171" />
          <Text
            style={{
              marginTop: 16,
              fontSize: 16,
              color: "#F87171",
              fontWeight: "700",
            }}
          >
            Erro: Imóvel não encontrado
          </Text>
          <Text style={{ marginTop: 8, color: "#6B7280", textAlign: "center" }}>
            Não foi possível identificar o imóvel para associar o documento.
          </Text>
          <Button
            title="Voltar"
            onPress={() => router.back()}
            style={{ marginTop: 24 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={styles.screenTitle}>Upload de documentos</Text>
          <Text style={styles.screenSubtitle}>{headerSubtitle}</Text>
        </View>
      </View>

      {error || queryError ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <Alert type="error" message={error || String(queryError)} />
        </View>
      ) : null}

      {isLoading || isFetching ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>A carregar…</Text>
        </View>
      ) : (
        <FlatList
          data={suggestions}
          keyExtractor={(item, idx) => `${item.type}-${idx}`}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={onRefresh} />
          }
          contentContainerStyle={
            suggestions.length === 0 ? styles.emptyWrap : styles.listContent
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="documents-outline" size={28} color="#2563EB" />
              </View>

              <Text style={styles.emptyTitle}>
                Sem sugestões para este imóvel
              </Text>
              <Text style={styles.emptyText}>
                Podes fazer upload manual na mesma.
              </Text>

              <Button
                title="Fazer upload manual"
                onPress={() =>
                  uploadForSuggestion({
                    // @ts-ignore
                    type: "Other",
                    title: "Outro documento",
                    category: "Other",
                  })
                }
                style={{ marginTop: 14 }}
              />
            </View>
          }
        />
      )}

      {/* <View style={styles.footer}>
        <Ionicons name="information-circle-outline" size={18} color="#6B7280" />
        <Text style={styles.footerText}>
          Business+ usa upload via API (multipart) e download via API para
          documentos encriptados.
        </Text>
      </View> */}
    </SafeAreaView>
  );
}

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
    paddingBottom: 18,
  },

  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 24,
  },
  loadingText: { color: "#6B7280", fontSize: 13 },

  itemCard: {
    marginBottom: 10,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEF2F7",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 2 },
    }),
  },
  itemRow: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },
  itemMeta: {
    marginTop: 3,
    fontSize: 12,
    color: "#6B7280",
  },
  itemActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  uploadChip: {
    paddingHorizontal: 12,
    height: 30,
    borderRadius: 999,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadChipDisabled: {
    opacity: 0.7,
  },
  uploadChipText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  emptyWrap: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  emptyState: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#EEF2F7",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 2 },
    }),
    alignItems: "center",
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
  },
  emptyText: {
    marginTop: 6,
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 18,
  },

  footerNote: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
});
