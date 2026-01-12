import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert as RNAlert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/hooks/services/api";
import { AddonType, SubscriptionAddon } from "@/types/models";
import { getCurrentUserSubscription } from "@/hooks/services/subscription";

/* ----------------------------------------
 * Definição dos Add-ons (binários)
 * --------------------------------------*/

type AddonConfig = {
  type: AddonType;
  label: string;
  price: number;
  description: string;
  benefits: string[];
};

const ADDONS: AddonConfig[] = [
  {
    type: AddonType.ExtraDocuments,
    label: "Documentos extra",
    price: 5,
    description: "Aumenta a capacidade total de documentos.",
    benefits: ["+1 documento adicional"],
  },
  {
    type: AddonType.ExtraGuests,
    label: "Convidados extra",
    price: 5,
    description: "Permite convidar mais pessoas.",
    benefits: ["+1 convidado adicional"],
  },
  {
    type: AddonType.ExtraBuildings,
    label: "Prédio extra",
    price: 20,
    description: "Permite gerir mais um edifício completo.",
    benefits: ["+1 prédio", "+30 frações nesse prédio"],
  },
  {
    type: AddonType.ExtraAiDocs,
    label: "Documentos analisados por IA",
    price: 25,
    description: "Aumenta a capacidade de análise automática.",
    benefits: ["+50 documentos analisados por IA"],
  },
];

export default function AddonsScreen() {
  // ----------------------------------------
  // Queries
  // ----------------------------------------
  const { data, isLoading } = useQuery({
    queryKey: ["subscription"],
    queryFn: getCurrentUserSubscription,
  });

  // Destructure subscription and plan from the response
  const subscription = data?.subscription;
  const plan = data?.plan;
  console.log({ plan });
  const [addons, setAddons] = useState<
    Partial<Pick<SubscriptionAddon, "type" | "quantity">>[]
  >([]);

  useEffect(() => {
    if (subscription?.addons) setAddons(subscription.addons);
  }, [subscription]);

  // ----------------------------------------
  // Helpers
  // ----------------------------------------
  const hasAddon = React.useCallback(
    (type: AddonType) => addons.some((a) => a.type === type),
    [addons]
  );

  const toggleAddon = (type: AddonType) => {
    setAddons((prev) => {
      if (prev.some((a) => a.type === type))
        return prev.filter((a) => a.type !== type);

      return [...prev, { type, quantity: 1 }];
    });
  };

  // ----------------------------------------
  // Cálculos financeiros
  // ----------------------------------------
  const basePrice = plan?.priceMonthly ?? 0;

  const addonsTotal = useMemo(() => {
    return addons.reduce((sum, a) => {
      const cfg = ADDONS.find((x) => x.type === a.type);
      return sum + (cfg?.price ?? 0);
    }, 0);
  }, [addons]);

  const finalTotal = basePrice + addonsTotal;

  // ----------------------------------------
  // Mutation
  // ----------------------------------------
  const addonsPayload = useMemo(() => {
    return ADDONS.map((addon) => ({
      type: addon.type,
      quantity: hasAddon(addon.type) ? 1 : 0,
    }));
  }, [hasAddon]);

  const mutation = useMutation({
    mutationFn: async () =>
      api.post("/subscriptions/addons/stripe-update", {
        addons: addonsPayload,
      }),
    onSuccess: () => {
      RNAlert.alert(
        "Subscrição atualizada",
        "Os add-ons foram adicionados com sucesso."
      );
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>A carregar subscrição…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ----------------------------------------
  // UI
  // ----------------------------------------
  const isFreePlan = plan?.code === "free";

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Add-ons da subscrição</Text>
        <Text style={styles.subtitle}>
          Seleciona funcionalidades adicionais para a tua subscrição.
        </Text>

        {/* Plano */}
        <View style={styles.planCard}>
          <Text style={styles.planName}>{plan?.name}</Text>
          <Text style={styles.planPrice}>{basePrice.toFixed(2)} € / mês</Text>
        </View>

        {/* Add-ons */}
        <Text style={styles.sectionTitle}>Add-ons disponíveis</Text>

        {ADDONS.map((addon) => {
          const active = hasAddon(addon.type);

          return (
            <Pressable
              key={addon.type}
              style={[styles.addonCard, active && styles.addonCardActive]}
              onPress={() => !isFreePlan && toggleAddon(addon.type)}
              disabled={isFreePlan}
            >
              {/* Header */}
              <View style={styles.addonHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.addonLabel}>{addon.label}</Text>
                  <Text style={styles.addonDescription}>
                    {addon.description}
                  </Text>
                </View>

                {/* Checkbox */}
                <View
                  style={[styles.checkbox, active && styles.checkboxActive]}
                >
                  {active && (
                    <Ionicons name="checkmark" size={16} color="#065F46" />
                  )}
                </View>
              </View>

              {/* Benefits */}
              <View style={styles.benefits}>
                {addon.benefits.map((b, idx) => (
                  <View key={idx} style={styles.benefitRow}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#16A34A"
                    />
                    <Text style={styles.benefitText}>{b}</Text>
                  </View>
                ))}
              </View>

              {/* Price */}
              <View style={styles.priceRow}>
                <Text style={styles.priceText}>
                  {addon.price.toFixed(2)} € / mês
                </Text>
              </View>
            </Pressable>
          );
        })}

        {/* Resumo */}
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>Resumo mensal</Text>

          <Row label="Plano base" value={`${basePrice.toFixed(2)} €`} />

          {addons.map((a) => {
            const cfg = ADDONS.find((x) => x.type === a.type);
            return (
              <Row
                key={a.type}
                label={cfg?.label ?? "Add-on"}
                value={`${cfg?.price.toFixed(2)} €`}
              />
            );
          })}

          <View style={styles.divider} />

          <Row label="Total" value={`${finalTotal.toFixed(2)} €`} bold />

          <Text style={styles.warning}>
            Os add-ons são cobrados mensalmente e entram em vigor imediatamente.
          </Text>
        </View>

        <Pressable
          style={styles.confirmBtn}
          onPress={() => mutation.mutate()}
          disabled={mutation.isPending}
        >
          <Text style={styles.confirmText}>
            {mutation.isPending ? "A confirmar…" : "Confirmar alterações"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ----------------------------------------
 * Small helpers
 * --------------------------------------*/

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryText, bold && styles.bold]}>{label}</Text>
      <Text style={[styles.summaryText, bold && styles.bold]}>{value}</Text>
    </View>
  );
}

/* ----------------------------------------
 * Styles
 * --------------------------------------*/

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff", paddingBottom: 40 },
  container: { padding: 16, paddingBottom: 40 },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 8, fontWeight: "800" },

  title: { fontSize: 22, fontWeight: "900" },
  subtitle: { marginTop: 6, fontSize: 13, color: "#666" },

  planCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#111",
  },
  planName: { color: "#fff", fontWeight: "900" },
  planPrice: { color: "#CFCFCF", marginTop: 4 },

  sectionTitle: {
    marginTop: 20,
    marginBottom: 10,
    fontSize: 16,
    fontWeight: "900",
  },

  addonCard: {
    borderWidth: 1,
    borderColor: "#EAEAEA",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  addonCardActive: {
    borderColor: "#A7F3D0",
    backgroundColor: "#ECFDF5",
  },

  addonHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  addonLabel: { fontWeight: "900", fontSize: 14 },
  addonDescription: {
    marginTop: 4,
    fontSize: 12,
    color: "#666",
  },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxActive: {
    borderColor: "#34D399",
    backgroundColor: "#D1FAE5",
  },

  benefits: { marginTop: 10, gap: 6 },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  benefitText: { fontSize: 12, fontWeight: "700", color: "#166534" },

  priceRow: {
    marginTop: 10,
    alignItems: "flex-end",
  },
  priceText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#111",
  },

  summaryBox: {
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  summaryTitle: { fontWeight: "900", marginBottom: 10 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  summaryText: { fontSize: 13 },
  bold: { fontWeight: "900" },
  divider: { height: 1, backgroundColor: "#EAEAEA", marginVertical: 10 },

  warning: {
    marginTop: 10,
    fontSize: 12,
    color: "#92400E",
    lineHeight: 16,
  },

  confirmBtn: {
    marginTop: 20,
    backgroundColor: "#111",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  confirmText: { color: "#fff", fontWeight: "900" },
});
