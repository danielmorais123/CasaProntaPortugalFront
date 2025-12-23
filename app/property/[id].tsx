import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/Button";
import { Alert } from "@/components/Alert"; // o teu Alert shadcn-style
import { DocumentType } from "@/types/models";
import BottomSheetComponent from "@/components/BottomSheetComponent";
import { ShareProperty } from "@/components/ShareProperty";
import BottomSheet from "@gorhom/bottom-sheet";
import { useLocalSearchParams, useRouter } from "expo-router";
import { deleteProperty } from "@/hooks/services/property";

export default function PropertyDetailScreen() {
  const useRefBottomSheet = useRef<BottomSheet>(null);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const handleOpen = () => {
    useRefBottomSheet.current?.expand();
  };

  const handleDelete = async () => {
    try {
      await deleteProperty(id as string);
      // Optionally show a toast/snackbar here
      router.push("/"); // Go back to home or properties list
    } catch (err) {
      // Optionally show error to user
      console.error("Erro ao apagar imóvel:", err);
    }
  };

  // mock data (substituir por API)
  const property = {
    name: "Apartamento Lisboa",
    address: "Rua das Flores, Lisboa",
    image: "https://via.placeholder.com/600",
    sharedWith: [
      { id: 1, name: "Maria Silva", role: "Inquilina" },
      { id: 2, name: "Imobiliária XPTO", role: "Gestor" },
    ],
    alerts: [
      {
        id: 1,
        title: "Certificado Energético",
        description: "Expira em 15 dias",
        variant: "warning",
      },
    ],
    documents: [
      {
        id: 1,
        type: DocumentType.CertificadoEnergetico,
        fileName: "certificado_energetico_2024.pdf",
      },
      {
        id: 2,
        type: DocumentType.TituloAquisicaoOuEscritura,
        fileName: "escritura.pdf",
      },
    ],
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image */}
        <Image source={{ uri: property.image }} style={styles.image} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{property.name}</Text>
          <Text style={styles.subtitle}>{property.address}</Text>
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <SummaryCard
            icon="alert-circle-outline"
            label="Alertas"
            value={property.alerts.length}
            color="#F59E0B"
          />
          <SummaryCard
            icon="document-text-outline"
            label="Documentos"
            value={property.documents.length}
            color="#2563EB"
          />
          <SummaryCard
            icon="people-outline"
            label="Partilhas"
            value={property.sharedWith.length}
            color="#10B981"
          />
        </View>

        {/* Alerts */}
        <Section title="Alertas">
          {property.alerts.length === 0 ? (
            <EmptyState text="Sem alertas ativos 🎉" />
          ) : (
            property.alerts.map((alert) => (
              <Alert
                key={alert.id}
                title={alert.title}
                description={alert.description}
                variant={alert.variant as any}
              />
            ))
          )}
        </Section>

        {/* Documents */}
        <Section title="Documentos">
          {property.documents.map((doc) => (
            <View key={doc.id} style={styles.documentCard}>
              <Ionicons
                name="document-text-outline"
                size={22}
                color="#2563EB"
              />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.documentTitle}>
                  {DocumentType[doc.type]}
                </Text>
                <Text style={styles.documentFileName} numberOfLines={1}>
                  {doc.fileName}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </View>
          ))}

          <Button
            title="Adicionar documento"
            variant="outline"
            size="sm"
            style={{ marginTop: 10 }}
          />
        </Section>

        {/* Sharing */}
        <Section title="Partilhado com">
          {property.sharedWith.map((user) => (
            <View key={user.id} style={styles.shareItem}>
              <Ionicons
                name="person-circle-outline"
                size={36}
                color="#6B7280"
              />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={{ fontWeight: "600" }}>{user.name}</Text>
                <Text style={{ color: "#6B7280" }}>{user.role}</Text>
              </View>
              <TouchableOpacity>
                <Ionicons
                  name="ellipsis-horizontal"
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>
          ))}

          <Button title="Partilhar imóvel" onPress={handleOpen} />
          <BottomSheetComponent ref={useRefBottomSheet}>
            <ShareProperty propertyId={id} />
          </BottomSheetComponent>
        </Section>

        {/* Actions */}
        <View style={styles.actions}>
          <Button title="Editar imóvel" variant="ghost" />
          <Button
            title="Apagar imóvel"
            variant="destructive"
            onPress={handleDelete}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}
function SummaryCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={styles.summaryCard}>
      <Ionicons name={icon as any} size={20} color={color} />
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}
function EmptyState({ text }: { text: string }) {
  return <Text style={{ color: "#6B7280", marginTop: 4 }}>{text}</Text>;
}
const styles = StyleSheet.create({
  image: {
    width: "100%",
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    color: "#6B7280",
  },
  summary: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 4,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 6,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  section: {
    padding: 20,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  documentCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  documentTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  documentFileName: {
    fontSize: 13,
    color: "#6B7280",
  },
  shareItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 12,
  },
  actions: {
    padding: 20,
    gap: 10,
  },
});
