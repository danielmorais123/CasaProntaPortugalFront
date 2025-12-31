// Restrict property types by subscription plan
import React, { useMemo, useState, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { getAllProperties } from "@/hooks/services/property";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { api } from "@/hooks/services/api";
import { Property, PropertyType } from "@/types/models";
import { useError } from "@/context/ErrorContext"; // <-- import
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const allowedTypesByPlan: Record<string, PropertyType[]> = {
  free: [PropertyType.House, PropertyType.Apartment, PropertyType.Land],
  starter: [PropertyType.House, PropertyType.Apartment, PropertyType.Land],
  pro: [
    PropertyType.House,
    PropertyType.Apartment,
    PropertyType.Land,
    PropertyType.Building,
  ],
  business: [
    PropertyType.House,
    PropertyType.Apartment,
    PropertyType.Land,
    PropertyType.Building,
    PropertyType.Unit,
  ],
  portfolio: [
    PropertyType.House,
    PropertyType.Apartment,
    PropertyType.Land,
    PropertyType.Building,
    PropertyType.Unit,
  ],
  enterprise: [
    PropertyType.House,
    PropertyType.Apartment,
    PropertyType.Land,
    PropertyType.Building,
    PropertyType.Unit,
  ],
};

const propertyTypeLabel = (t: PropertyType) => {
  switch (t) {
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
};

type CreatePropertyPayload = {
  name: string;
  streetName: string;
  type: PropertyType; // ✅ aqui assumo que já tens type (porque disseste que já tens lógica por tipo)
};

/* ------------------------ Document rules (pluga a tua) ------------------------ */
/**
 * Se tu já tens esta lógica noutro ficheiro (ex. /hooks/propertyDocs.ts),
 * substitui esta função pela tua.
 */
// function getRecommendedDocTypesForPropertyType(
//   type: PropertyType
// ): DocumentType[] {
//   switch (type) {
//     case PropertyType.House:
//     case PropertyType.Apartment:
//       return [
//         DocumentType.TituloAquisicaoOuEscritura,
//         DocumentType.CadernetaPredial,
//         DocumentType.CertidaoPermanenteRegistoPredial,
//         DocumentType.LicencaUtilizacaoOuIsencao,
//         DocumentType.CertificadoEnergetico,
//         DocumentType.ComprovativoPagamentoIMI,
//       ];

//     case PropertyType.Land:
//       return [
//         DocumentType.CadernetaPredial,
//         DocumentType.CertidaoPermanenteRegistoPredial,
//         DocumentType.PlantaLocalizacao,
//         DocumentType.LevantamentoTopografico,
//         DocumentType.InformacaoPreviaOuPIP,
//         DocumentType.AlvaraLoteamento,
//       ];

//     case PropertyType.Building:
//       return [
//         DocumentType.RegulamentoCondominio,
//         DocumentType.AtasCondominio,
//         DocumentType.SeguroEdificioPartesComuns,
//         DocumentType.RelatorioContasCondominio,
//         DocumentType.MapaQuotasERecibosCondominio,
//         DocumentType.ContratoAdministracaoCondominio,
//         DocumentType.ContratosManutencao,
//       ];

//     case PropertyType.Unit:
//       return [
//         DocumentType.TituloAquisicaoOuEscritura,
//         DocumentType.CadernetaPredial,
//         DocumentType.CertidaoPermanenteRegistoPredial,
//         DocumentType.ComprovativoPagamentoIMI,
//       ];

//     default:
//       return [];
//   }
// }

// function propertyTypeLabel(t: PropertyType) {
//   switch (t) {
//     case PropertyType.House:
//       return "Moradia";
//     case PropertyType.Apartment:
//       return "Apartamento";
//     case PropertyType.Land:
//       return "Terreno";
//     case PropertyType.Building:
//       return "Prédio";
//     case PropertyType.Unit:
//       return "Fração";
//     default:
//       return "Imóvel";
//   }
// }

// function docTypeLabel(type: DocumentType) {
//   // Não precisa ser completo — podes expandir quando quiseres
//   switch (type) {
//     case DocumentType.CadernetaPredial:
//       return "Caderneta Predial";
//     case DocumentType.CertidaoPermanenteRegistoPredial:
//       return "Certidão Permanente";
//     case DocumentType.TituloAquisicaoOuEscritura:
//       return "Escritura / Título";
//     case DocumentType.LicencaUtilizacaoOuIsencao:
//       return "Licença / Isenção";
//     case DocumentType.CertificadoEnergetico:
//       return "Certificado Energético";
//     case DocumentType.ComprovativoPagamentoIMI:
//       return "Comprovativo IMI";
//     case DocumentType.ContratoArrendamento:
//       return "Contrato de Arrendamento";
//     case DocumentType.PlantaLocalizacao:
//       return "Planta de Localização";
//     case DocumentType.LevantamentoTopografico:
//       return "Levantamento Topográfico";
//     case DocumentType.InformacaoPreviaOuPIP:
//       return "Informação Prévia / PIP";
//     case DocumentType.AlvaraLoteamento:
//       return "Alvará de Loteamento";
//     case DocumentType.RegulamentoCondominio:
//       return "Regulamento do Condomínio";
//     case DocumentType.AtasCondominio:
//       return "Atas do Condomínio";
//     case DocumentType.SeguroEdificioPartesComuns:
//       return "Seguro do Edifício (Partes Comuns)";
//     case DocumentType.RelatorioContasCondominio:
//       return "Relatório de Contas";
//     case DocumentType.MapaQuotasERecibosCondominio:
//       return "Mapa Quotas & Recibos";
//     case DocumentType.ContratoAdministracaoCondominio:
//       return "Administração do Condomínio";
//     case DocumentType.ContratosManutencao:
//       return "Contratos de Manutenção";
//     default:
//       return "Documento";
//   }
// }

/* -------------------------------- UI bits -------------------------------- */

// function Pill({ text }: { text: string }) {
//   return (
//     <View style={styles.pill}>
//       <Text style={styles.pillText}>{text}</Text>
//     </View>
//   );
// }

function TypePill({
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
      style={[styles.typePill, active && styles.typePillActive]}
    >
      <Text style={[styles.typePillText, active && styles.typePillTextActive]}>
        {text}
      </Text>
    </Pressable>
  );
}

// function DocChecklistRow({
//   title,
//   done,
//   onUpload,
// }: {
//   title: string;
//   done: boolean;
//   onUpload: () => void;
// }) {
//   return (
//     <View style={styles.checkRow}>
//       <View
//         style={[
//           styles.checkDot,
//           done ? styles.checkDotDone : styles.checkDotTodo,
//         ]}
//       >
//         <Ionicons
//           name={done ? "checkmark" : "add"}
//           size={14}
//           color={done ? "#fff" : "#111"}
//         />
//       </View>

//       <Text style={styles.checkTitle} numberOfLines={1}>
//         {title}
//       </Text>

//       {done ? (
//         <View style={styles.donePill}>
//           <Text style={styles.donePillText}>OK</Text>
//         </View>
//       ) : (
//         <Pressable onPress={onUpload} style={styles.uploadMiniBtn}>
//           <Text style={styles.uploadMiniBtnText}>Upload</Text>
//         </Pressable>
//       )}
//     </View>
//   );
// }

// function DocumentRow({ d, onPress }: { d: Document; onPress: () => void }) {
//   return (
//     <Pressable onPress={onPress} style={styles.row}>
//       <View style={styles.rowIcon}>
//         <Ionicons name="document-text-outline" size={18} />
//       </View>

//       <View style={{ flex: 1 }}>
//         <Text style={styles.rowTitle} numberOfLines={1}>
//           {docTypeLabel(d.type)}
//         </Text>
//         <Text style={styles.rowSubtitle} numberOfLines={1}>
//           {d.expirationDate
//             ? `Validade: ${new Date(d.expirationDate).toLocaleDateString(
//                 "pt-PT"
//               )}`
//             : "Sem validade"}
//         </Text>
//       </View>

//       <Text style={styles.rowChevron}>›</Text>
//     </Pressable>
//   );
// }

/* -------------------------------- Screen -------------------------------- */

export default function AddPropertyScreen() {
  const router = useRouter();
  const { setError } = useError();
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient(); // <--- adiciona isto

  const [name, setName] = useState("");
  const [streetName, setStreetName] = useState("");
  const [type, setType] = useState<PropertyType>(PropertyType.Apartment);

  const [submitting, setSubmitting] = useState(false);
  const [, setMessage] = useState<{
    type: "success" | "destructive";
    text: string;
  } | null>(null);
  const userPlan = user?.planCode?.toLowerCase() || "free";
  const allowedTypes =
    allowedTypesByPlan[userPlan] || allowedTypesByPlan["free"];
  // Use React Query for property count and limit
  const {
    data: propertyStats,
    isLoading: statsLoading,
    isFetching: statsFetching,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["property-stats", user?.id],
    queryFn: async () => {
      const res = await getAllProperties(1, 1); // Only need total count
      return {
        count: res.total ?? 0,
        limit:
          user?.plan?.limits?.maxProperties ?? user?.maxProperties ?? undefined,
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const propertyCount = propertyStats?.count ?? 0;
  const propertyLimit = propertyStats?.limit;

  const reachedLimit = useMemo(() => {
    return propertyLimit !== undefined && propertyCount >= propertyLimit;
  }, [propertyCount, propertyLimit]);

  // Created property id state
  const [createdId, setCreatedId] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return (
      name.trim().length >= 2 && streetName.trim().length >= 3 && !submitting
    );
  }, [name, streetName, submitting]);

  // const docs = created?.documents ?? [];
  // const recommended = useMemo(
  //   () => getRecommendedDocTypesForPropertyType(type),
  //   [type]
  // );

  // const existingTypes = useMemo(() => new Set(docs.map((d) => d.type)), [docs]);

  // const missingCount = useMemo(() => {
  //   return recommended.filter((t) => !existingTypes.has(t)).length;
  // }, [recommended, existingTypes]);

  // React Query for fetching created property
  const {
    data: created,
    isLoading: createdLoading,
    isFetching: createdFetching,
    error: createdError,
    refetch: refetchCreated,
  } = useQuery({
    queryKey: ["created-property", createdId],
    queryFn: async () => {
      if (!createdId) return null;
      const res = await api.get(`/property/${createdId}`);
      return res.data as Property;
    },
    enabled: !!createdId,
    staleTime: 0,
  });

  // React Query mutation for creating property
  const createPropertyMutation = useMutation({
    mutationFn: async (payload: CreatePropertyPayload) => {
      const res = await api.post("/property", payload);
      return res.data as Property;
    },
    onSuccess: (createdObj) => {
      setMessage({
        type: "success",
        text: "Imóvel criado! Agora adiciona os documentos essenciais.",
      });
      if (createdObj?.id) {
        setCreatedId(createdObj.id);
      }
      queryClient.invalidateQueries({ queryKey: ["properties"] }); // <--- invalida cache
      queryClient.invalidateQueries({ queryKey: ["property-stats"] }); // <--- se usares stats
      router.replace("/property");
    },
    onError: (err: any) => {
      setMessage({
        type: "destructive",
        text: err?.response?.data,
      });
      setError(err?.response?.data);
    },
    onSettled: () => {
      setSubmitting(false);
    },
  });

  const submit = async () => {
    setMessage(null);
    setSubmitting(true);
    createPropertyMutation.mutate({
      name: name.trim(),
      streetName: streetName.trim(),
      type,
    });
  };

  const onRefresh = async () => {
    if (!createdId) return;
    await refetchCreated();
  };
  // Use React Query loading/error states for created property
  if (createdLoading || createdFetching) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator />
          <Text style={{ marginTop: 16, color: "#666", fontWeight: "800" }}>
            A carregar imóvel criado…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (createdError) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
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
            Erro ao carregar imóvel criado
          </Text>
          <Text style={{ marginTop: 8, color: "#6B7280", textAlign: "center" }}>
            Não foi possível obter o imóvel criado. Tenta novamente.
          </Text>
          <Pressable onPress={onRefresh} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Tentar novamente</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // const goUpload = (docType?: DocumentType) => {
  //   if (!created?.id) return;

  //   router.push({
  //     pathname: "/documents/upload",
  //     params: {
  //       propertyId: created.id,
  //       // ✅ passa o tipo para o upload pré-selecionar (adapta no teu upload screen)
  //       documentType: docType ? String(docType) : undefined,
  //     },
  //   });
  // };

  // Use React Query loading/error states for stats
  if (statsLoading || statsFetching) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator />
          <Text style={{ marginTop: 16, color: "#666", fontWeight: "800" }}>
            A carregar limites do plano…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (statsError) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
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
            Erro ao carregar limites do plano
          </Text>
          <Text style={{ marginTop: 8, color: "#6B7280", textAlign: "center" }}>
            Não foi possível obter os limites do teu plano. Tenta novamente.
          </Text>
          <Pressable onPress={() => refetchStats()} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Tentar novamente</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable
            style={styles.iconBtn}
            onPress={() => router.back()}
            hitSlop={10}
          >
            <Ionicons name="arrow-back" size={18} />
          </Pressable>

          <Text style={styles.topTitle}>Criar imóvel</Text>

          <Pressable
            style={styles.iconBtn}
            onPress={() => router.push("/property/about")}
            hitSlop={10}
          >
            <Ionicons name="help-circle-outline" size={18} />
          </Pressable>
        </View>

        <Text style={styles.title}>Novo imóvel</Text>
        <Text style={styles.subtitle}>
          {reachedLimit
            ? "Atingiste o limite de imóveis do teu plano. Faz upgrade para adicionar mais."
            : "Cria o imóvel e depois faz upload dos documentos essenciais (por tipo). Assim ficas logo organizado."}
        </Text>

        {/* Block creation if limit reached */}
        {reachedLimit ? (
          <View style={styles.card}>
            <Text style={styles.emptyTitle}>Limite atingido</Text>
            <Text style={styles.emptyText}>
              O teu plano permite até {propertyLimit} imóveis. Remove um imóvel
              ou faz upgrade de plano para adicionar mais.
            </Text>
            <Pressable
              style={styles.primaryBtn}
              onPress={() => router.push("/profile/plans-help")}
            >
              <Text style={styles.primaryBtnText}>Ver planos</Text>
            </Pressable>
          </View>
        ) : (
          /* Passo 1: Criar */
          <View style={styles.card}>
            <Text style={styles.label}>Nome do imóvel</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Ex.: Apartamento Lisboa"
              placeholderTextColor="#999"
              style={styles.input}
            />

            <Text style={[styles.label, { marginTop: 12 }]}>Rua / Morada</Text>
            <TextInput
              value={streetName}
              onChangeText={setStreetName}
              placeholder="Ex.: Rua X, nº Y, Lisboa"
              placeholderTextColor="#999"
              style={styles.input}
            />

            <Text style={[styles.label, { marginTop: 12 }]}>Tipo</Text>
            <View style={styles.typeRow}>
              {allowedTypes.map((t) => (
                <TypePill
                  key={t}
                  text={propertyTypeLabel(t)}
                  active={type === t}
                  onPress={() => setType(t)}
                />
              ))}
            </View>

            <View style={{ height: 14 }} />

            <Pressable
              onPress={submit}
              disabled={!canSubmit}
              style={[
                styles.primaryBtn,
                !canSubmit && styles.primaryBtnDisabled,
              ]}
            >
              {submitting ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <ActivityIndicator color="#fff" />
                  <Text style={styles.primaryBtnText}>A criar…</Text>
                </View>
              ) : (
                <Text style={styles.primaryBtnText}>Criar imóvel</Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => router.push("/property/create-help")}
              style={styles.secondaryBtn}
            >
              <Text style={styles.secondaryBtnText}>Ver tipos de imóveis</Text>
            </Pressable>
          </View>
        )}

        <View style={{ height: 18 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* -------------------------------- Styles -------------------------------- */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 16, paddingBottom: 24 },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: { flex: 1, textAlign: "center", fontWeight: "900", color: "#111" },

  title: { fontSize: 22, fontWeight: "900", marginTop: 4 },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: "#666",
    fontWeight: "700",
    lineHeight: 18,
  },

  card: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    borderRadius: 16,
    padding: 14,
    backgroundColor: "#fff",
  },

  label: { fontSize: 12, fontWeight: "900", color: "#111", marginBottom: 6 },
  input: {
    backgroundColor: "#F7F7F7",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111",
  },

  typeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  typePill: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#F2F2F2",
  },
  typePillActive: { backgroundColor: "#111" },
  typePillText: { fontSize: 12, fontWeight: "900", color: "#111" },
  typePillTextActive: { color: "#fff" },

  primaryBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  primaryBtnDisabled: { opacity: 0.4 },
  primaryBtnText: { color: "#fff", fontWeight: "900" },

  secondaryBtn: {
    marginTop: 10,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  secondaryBtnText: { fontWeight: "900", color: "#111", textAlign: "center" },

  createdHeader: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    borderRadius: 16,
    padding: 14,
    backgroundColor: "#FAFAFA",
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  createdTitle: { fontSize: 16, fontWeight: "900", color: "#111" },
  createdSubtitle: {
    marginTop: 4,
    color: "#666",
    fontWeight: "800",
    fontSize: 12,
  },

  pillsRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 10 },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#F2F2F2",
  },
  pillText: { fontSize: 12, fontWeight: "800", color: "#111" },

  sectionTitle: {
    marginTop: 16,
    marginBottom: 6,
    fontSize: 16,
    fontWeight: "900",
  },
  sectionHint: {
    color: "#666",
    fontWeight: "700",
    fontSize: 12,
    lineHeight: 16,
  },

  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1",
  },
  checkDot: {
    width: 28,
    height: 28,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkDotDone: { backgroundColor: "#111" },
  checkDotTodo: { backgroundColor: "#F2F2F2" },
  checkTitle: { flex: 1, fontWeight: "900", color: "#111", fontSize: 13 },

  donePill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  donePillText: { fontWeight: "900", color: "#047857", fontSize: 11 },

  uploadMiniBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#111",
  },
  uploadMiniBtnText: { color: "#fff", fontWeight: "900", fontSize: 12 },

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

  emptyBox: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    borderRadius: 16,
    padding: 14,
    backgroundColor: "#FAFAFA",
  },
  emptyTitle: { fontWeight: "900", marginBottom: 6, fontSize: 14 },
  emptyText: { color: "#555", lineHeight: 18, fontSize: 13, fontWeight: "700" },

  tipBox: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    borderRadius: 16,
    padding: 14,
    backgroundColor: "#FAFAFA",
  },
  tipTitle: { fontWeight: "900", marginBottom: 6, fontSize: 13 },
  tipText: { color: "#555", lineHeight: 18, fontSize: 13, fontWeight: "700" },

  muted: { color: "#666", fontWeight: "800" },
});
