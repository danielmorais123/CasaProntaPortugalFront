import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { LoadErrorScreen } from "@/components/StateScreens";
import { getMyPayments } from "@/hooks/services/payment";
import { PaymentStatus, Payment } from "@/types/models";

/* ----------------------------------------
 * Helpers
 * --------------------------------------*/

function formatMoney(amount: number, currency = "EUR") {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency,
  }).format(amount);
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusMeta(status: PaymentStatus) {
  switch (status) {
    case PaymentStatus.Paid:
      return { label: "Pago", color: "#047857", bg: "#ECFDF5" };
    case PaymentStatus.Pending:
      return { label: "Pendente", color: "#92400E", bg: "#FFFBEB" };
    case PaymentStatus.Refunded:
      return { label: "Reembolsado", color: "#2563EB", bg: "#EFF6FF" };
    case PaymentStatus.Failed:
    case PaymentStatus.Canceled:
    case PaymentStatus.Unpaid:
      return { label: "Falhado", color: "#B91C1C", bg: "#FEF2F2" };
    default:
      return { label: String(status), color: "#374151", bg: "#F3F4F6" };
  }
}

/* ----------------------------------------
 * Components
 * --------------------------------------*/

function PaymentCard({ p }: { p: Payment }) {
  const meta = statusMeta(p.status);

  return (
    <View style={styles.paymentCard}>
      <View style={styles.paymentHeader}>
        <View style={[styles.statusPill, { backgroundColor: meta.bg }]}>
          <Text style={[styles.statusText, { color: meta.color }]}>
            {meta.label}
          </Text>
        </View>

        <Text style={styles.amount}>{formatMoney(p.amount, p.currency)}</Text>
      </View>

      <Text style={styles.paymentLabel}>Subscrição / Add-ons</Text>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>
          {formatDate(p.paidAt ?? p.createdAt)}
        </Text>
        <Text style={styles.metaDot}>•</Text>
        <Text style={styles.metaText}>
          REF {p.stripePaymentId.slice(0, 10)}…
        </Text>
      </View>
    </View>
  );
}

/* ----------------------------------------
 * Screen
 * --------------------------------------*/

export default function PaymentsScreen() {
  const router = useRouter();

  const {
    data: payments = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["payments"],
    queryFn: getMyPayments,
  });

  const totalPaid = useMemo(() => {
    return payments
      .filter((p) => p.status === PaymentStatus.Paid)
      .reduce((sum, p) => sum + p.amount, 0);
  }, [payments]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>A carregar pagamentos…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadErrorScreen
          onRetry={refetch}
          title="Erro ao carregar pagamentos"
          subtitle="Não foi possível obter os pagamentos."
        />
      </SafeAreaView>
    );
  }

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

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Pagamentos</Text>
            <Text style={styles.subtitle}>
              Histórico financeiro da tua conta
            </Text>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total pago</Text>
          <Text style={styles.summaryValue}>{formatMoney(totalPaid)}</Text>
          <Text style={styles.summaryHint}>
            {payments.length} pagamentos registados
          </Text>
        </View>

        {/* List */}
        {payments.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="card-outline" size={32} color="#94A3B8" />
            <Text style={styles.emptyTitle}>Sem pagamentos</Text>
            <Text style={styles.emptyText}>
              Quando fizeres uma subscrição ou upgrade, os pagamentos aparecem
              aqui.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {payments.map((p) => (
              <PaymentCard key={p.id} p={p} />
            ))}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ----------------------------------------
 * Styles
 * --------------------------------------*/

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { padding: 18, paddingBottom: 32 },

  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  loadingText: { fontWeight: "800", color: "#64748B" },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },

  title: { fontSize: 20, fontWeight: "900", color: "#0F172A" },
  subtitle: { marginTop: 4, fontSize: 13, color: "#64748B" },

  summaryCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#0F172A",
    marginBottom: 16,
  },
  summaryLabel: { color: "#CBD5E1", fontSize: 12, fontWeight: "700" },
  summaryValue: {
    marginTop: 4,
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
  },
  summaryHint: {
    marginTop: 4,
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "700",
  },

  list: { gap: 12 },

  paymentCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  paymentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  amount: { fontSize: 16, fontWeight: "900", color: "#0F172A" },

  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusText: { fontSize: 12, fontWeight: "900" },

  paymentLabel: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "800",
    color: "#334155",
  },

  metaRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "700",
  },
  metaDot: { color: "#CBD5E1", fontWeight: "900" },

  emptyBox: {
    marginTop: 30,
    padding: 20,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: { fontSize: 14, fontWeight: "900", color: "#0F172A" },
  emptyText: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
  },
});
