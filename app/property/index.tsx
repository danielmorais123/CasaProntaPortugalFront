import React from "react";
import { View, Text, StyleSheet, Image, ScrollView } from "react-native";
import { Button } from "@/components/Button";
import { Alert } from "@/components/Alert";

export default function PropertyDetailScreen() {
  return (
    <ScrollView style={styles.container}>
      {/* Image */}
      <Image
        source={{ uri: "https://via.placeholder.com/400" }}
        style={styles.image}
      />

      {/* Info */}
      <View style={styles.section}>
        <Text style={styles.title}>Apartamento Lisboa</Text>
        <Text style={styles.subtitle}>Rua das Flores, Lisboa</Text>
      </View>

      {/* Alerts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alertas</Text>

        <Alert
          variant="warning"
          title="Certificado energético"
          description="Expira em 15 dias"
        />

        <Alert
          variant="destructive"
          title="IMI"
          description="Pagamento em atraso"
        />
      </View>

      {/* Documents */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Documentos</Text>

        <View style={styles.docItem}>
          <Text>📄 Escritura</Text>
        </View>

        <View style={styles.docItem}>
          <Text>📄 Certificado Energético</Text>
        </View>

        <View style={styles.docItem}>
          <Text>📄 Planta</Text>
        </View>

        <Button title="Adicionar documento" variant="outline" size="sm" />
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Button title="Partilhar acesso" variant="secondary" />
        <Button title="Editar imóvel" variant="ghost" />
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  image: {
    width: "100%",
    height: 220,
  },
  section: {
    padding: 20,
    gap: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    color: "#6B7280",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6,
  },
  docItem: {
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  actions: {
    padding: 20,
    gap: 10,
  },
});
