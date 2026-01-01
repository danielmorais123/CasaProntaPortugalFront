import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ShareProperty } from "@/components/ShareProperty";

function Pill({ text }: { text: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>{text}</Text>
    </View>
  );
}

export default function SharePropertyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const propertyId = String(params.id ?? "");

  const subtitle = useMemo(() => {
    if (!propertyId) return "—";
    return `Imóvel #${propertyId.slice(0, 8)}…`;
  }, [propertyId]);

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

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Partilhar imóvel</Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>

          <View style={styles.iconBadge}>
            <Ionicons name="share-social-outline" size={18} color="#111" />
          </View>
        </View>

        {/* Info card */}
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#111" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Acesso controlado</Text>
            <Text style={styles.infoText}>
              Escolhe o utilizador e define permissões. Podes definir uma
              validade para acesso temporário.
            </Text>
            <View
              style={{
                flexDirection: "row",
                gap: 8,
                flexWrap: "wrap",
                marginTop: 10,
              }}
            >
              <Pill text="Leitura: ver documentos" />
              <Pill text="Gestão: editar & gerir" />
              <Pill text="Validade opcional" />
            </View>
          </View>
        </View>

        {/* Form */}
        <ShareProperty propertyId={propertyId} />

        <View style={{ height: 18 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 16, paddingBottom: 24 },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 18, fontWeight: "900", color: "#111" },
  subtitle: { marginTop: 4, fontSize: 12, color: "#666", fontWeight: "700" },

  infoCard: {
    borderWidth: 1,
    borderColor: "#EAEAEA",
    borderRadius: 16,
    padding: 14,
    backgroundColor: "#FAFAFA",
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  infoTitle: { fontSize: 14, fontWeight: "900", color: "#111" },
  infoText: {
    marginTop: 6,
    fontSize: 13,
    color: "#555",
    lineHeight: 18,
    fontWeight: "700",
  },

  pill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#F2F2F2",
  },
  pillText: { fontSize: 12, fontWeight: "800", color: "#111" },
});
