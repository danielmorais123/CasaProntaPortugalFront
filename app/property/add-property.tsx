import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/Button";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { DocumentType, DocumentCategory } from "@/types/models";
import * as DocumentPicker from "expo-document-picker";
import { createProperty } from "@/hooks/services/property";
import { api } from "@/hooks/services/api";
import { AuthContext } from "@/context/AuthContext";

// Available document types
const availableDocumentTypes = [
  { label: "Caderneta Predial", value: DocumentType.CadernetaPredial },
  {
    label: "Certidão Permanente Registo Predial",
    value: DocumentType.CertidaoPermanenteRegistoPredial,
  },
  {
    label: "Licença de Utilização ou Isenção",
    value: DocumentType.LicencaUtilizacaoOuIsencao,
  },
  {
    label: "Certificado Energético",
    value: DocumentType.CertificadoEnergetico,
  },
  {
    label: "Ficha Técnica de Habitação",
    value: DocumentType.FichaTecnicaHabitacao,
  },
  {
    label: "Plantas Imóvel ou Camarárias",
    value: DocumentType.PlantasImovelOuCamararias,
  },
  {
    label: "Projeto Construção e Licenças de Obra",
    value: DocumentType.ProjetoConstrucaoELicencasObra,
  },
  {
    label: "Comprovativo Pagamento IMI",
    value: DocumentType.ComprovativoPagamentoIMI,
  },
  {
    label: "Título Aquisição ou Escritura",
    value: DocumentType.TituloAquisicaoOuEscritura,
  },
  {
    label: "Documentos Condomínio",
    value: DocumentType.DocumentosCondominio,
  },
  { label: "Outro", value: DocumentType.Other },
];

export default function AddPropertyScreen() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [documents, setDocuments] = useState<
    { title: string; type: DocumentType; file?: any }[]
  >([]);
  const { user } = useContext(AuthContext); // Get logged-in user

  const router = useRouter();

  const documentTypesToPick = availableDocumentTypes.filter(
    (docType) => !documents.find((d) => d.type === docType.value)
  );

  const handleDocumentTitleChange = (type: DocumentType, title: string) => {
    setDocuments((prev) =>
      prev.map((doc) => (doc.type === type ? { ...doc, title } : doc))
    );
  };

  const handleFileUpload = async (type: DocumentType) => {
    const result = await DocumentPicker.getDocumentAsync({});
    if (!result.canceled && result.assets?.length) {
      setDocuments((prev) => {
        const exists = prev.find((doc) => doc.type === type);
        if (exists) {
          return prev.map((doc) =>
            doc.type === type ? { ...doc, file: result.assets[0] } : doc
          );
        }
        return [...prev, { type, title: "", file: result.assets[0] }];
      });
    }
  };

  const handleRemovePickedDocument = (type: DocumentType) => {
    setDocuments((prev) => prev.filter((doc) => doc.type !== type));
  };

  const handleCreateProperty = async () => {
    try {
      // 1. Create property without documents
      const propertyPayload = {
        name,
        streetName: address,
        ownerId: user?.id,
        documents: [], // initially empty
      };
      const createdProperty = await createProperty(propertyPayload);
      const propertyId = createdProperty.id;

      // 2. Upload documents to S3 and confirm, now with propertyId
      const uploadedDocuments = [];
      for (const doc of documents) {
        const meta = {
          fileName: doc.file.name,
          contentType: doc.file.mimeType || "application/octet-stream",
          type: doc.type, // or just doc.type if already a number
          category: DocumentCategory.Other,
          title: doc.title,
          propertyId, // use the created propertyId here!
        };
        const uploadUrlRes = await api.post("/document/upload-url", meta);
        const { uploadUrl, s3Key, documentId } = uploadUrlRes.data;
        // Upload file to S3
        const s3Response = await fetch(uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": doc.file.mimeType || "application/octet-stream",
            "x-amz-server-side-encryption": "AES256",
          },
          body: await fetch(doc.file.uri).then((r) => r.blob()),
        });

        if (!s3Response.ok) {
          throw new Error("S3 upload failed");
        }

        // Optionally, add a small delay before confirm-upload
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Confirm upload
        await api.post(`/document/${documentId}/confirm-upload`, {
          documentId,
          uploadSuccessful: true,
        });

        // Collect document info
        uploadedDocuments.push({
          type: doc.type,
          title: doc.title,
          fileUrl: s3Key,
          originalFileName: doc.file.name,
          mimeType: doc.file.mimeType || "application/octet-stream",
          // Add other metadata as needed
        });
      }

      // 3. (Optional) Update property with documents if needed
      // await api.put(`/property/${propertyId}`, { documents: uploadedDocuments });

      router.push("/");
    } catch (err) {
      console.error(err);
      // Show error to user
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#F5F6FA" }}
      edges={["top"]}
    >
      <View style={styles.container}>
        {/* Header */}
        <Text style={styles.title}>Adicionar Imóvel</Text>
        <Text style={styles.subtitle}>Crie a pasta digital do seu imóvel</Text>

        {/* Scrollable Form */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.form}>
            <Text style={styles.label}>Nome do imóvel *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Apartamento Lisboa"
              value={name}
              onChangeText={setName}
            />
            <Text style={styles.label}>Morada</Text>
            <TextInput
              style={styles.input}
              placeholder="Rua, cidade..."
              value={address}
              onChangeText={setAddress}
            />
            {/* Picked documents */}
            {documents.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <Text style={[styles.label, { marginBottom: 8 }]}>
                  Documentos selecionados
                </Text>

                {documents.map((doc) => {
                  const docLabel =
                    availableDocumentTypes.find((d) => d.value === doc.type)
                      ?.label || "Documento";

                  return (
                    <View key={doc.type} style={styles.documentCard}>
                      {/* Left icon */}
                      <View style={styles.documentIcon}>
                        <Ionicons
                          name="document-text-outline"
                          size={22}
                          color="#2563EB"
                        />
                      </View>

                      {/* Text content */}
                      <View style={styles.documentContent}>
                        <Text style={styles.documentTitle}>
                          {docLabel}
                          {doc.type === DocumentType.Other && doc.title
                            ? ` – ${doc.title}`
                            : ""}
                        </Text>

                        {doc.file && (
                          <Text
                            style={styles.documentFileName}
                            numberOfLines={1}
                          >
                            {doc.file.name}
                          </Text>
                        )}
                      </View>

                      {/* Remove button */}
                      <TouchableOpacity
                        onPress={() => handleRemovePickedDocument(doc.type)}
                        style={styles.removeButton}
                      >
                        <Ionicons name="close" size={18} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}
            {/* Documents Scroll Section */}
            <Text style={styles.label}>Documentos disponíveis</Text>
            <View style={styles.documentsContainer}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 10 }}
              >
                {/* Available documents */}

                {documentTypesToPick.map((docType) => (
                  <View key={docType.value} style={styles.docPicker}>
                    <Text style={{ flex: 1 }}>{docType.label}</Text>

                    <View style={{ flex: 2, marginLeft: 10 }}>
                      {docType.value === DocumentType.Other && (
                        <TextInput
                          style={[styles.input, { marginBottom: 6 }]}
                          placeholder="Título do documento"
                          value={
                            documents.find((d) => d.type === docType.value)
                              ?.title || ""
                          }
                          onChangeText={(text) =>
                            handleDocumentTitleChange(docType.value, text)
                          }
                        />
                      )}

                      <TouchableOpacity
                        style={styles.uploadButton}
                        onPress={() => handleFileUpload(docType.value)}
                      >
                        <Ionicons
                          name="cloud-upload-outline"
                          size={18}
                          color="#2563EB"
                        />
                        <Text style={styles.uploadText}>
                          Selecionar ficheiro
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </ScrollView>

        {/* Fixed Actions */}
        <View style={styles.actionsFixed}>
          <Button title="Criar imóvel" onPress={handleCreateProperty} />
          <Button
            title="Cancelar"
            variant="destructive"
            onPress={() => router.push("/")}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F9FAFB",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    color: "#6B7280",
    marginBottom: 20,
  },
  form: {
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  documentsContainer: {
    maxHeight: 350,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 12,
    backgroundColor: "#FFFFFF",
  },
  documentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 12,
    marginBottom: 8,
  },

  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  documentContent: {
    flex: 1,
  },

  documentTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },

  documentFileName: {
    marginTop: 2,
    fontSize: 13,
    color: "#6B7280",
  },

  removeButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
    marginLeft: 10,
  },

  pickedDoc: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  pickedDocText: {
    marginLeft: 8,
    flex: 1,
  },
  docPicker: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  uploadButton: {
    backgroundColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  uploadText: {
    marginLeft: 8,
    color: "#2563EB",
  },
  actionsFixed: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#F9FAFB",
    paddingVertical: 10,
    paddingHorizontal: 20,
    gap: 10,
    // Optional: add shadow for iOS/Android
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 6,
  },
});
