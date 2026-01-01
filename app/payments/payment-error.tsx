import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

type Params = {
  title?: string;
  message?: string;
  code?: string;
  planCode?: string;
};

export default function PaymentErrorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();

  const title = useMemo(
    () => (params.title ? String(params.title) : "Pagamento falhou"),
    [params.title]
  );

  const message = useMemo(() => {
    if (params.message) return String(params.message);
    return "Não foi possível concluir o pagamento. Verifica os teus dados e tenta novamente.";
  }, [params.message]);

  const code = useMemo(
    () => (params.code ? String(params.code) : ""),
    [params.code]
  );

  const planCode = useMemo(
    () => (params.planCode ? String(params.planCode) : ""),
    [params.planCode]
  );

  const onRetry = () => {
    // go back to payment page with the same planCode if we have it
    router.replace({
      pathname: "/payments/payment",
      params: planCode ? { planCode } : undefined,
    } as any);
  };

  const onGoBack = () => {
    router.back();
  };

  const onSupport = () => {
    // You can wire this to your support screen/chat/email
    router.push("/profile/plans-help" as any);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable style={styles.iconBtn} onPress={onGoBack} hitSlop={10}>
          <Ionicons name="chevron-back" size={18} color="#111827" />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={styles.screenTitle}>Pagamento</Text>
          <Text style={styles.screenSubtitle}>Ocorreu um problema</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="close-circle-outline" size={26} color="#DC2626" />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.text}>{message}</Text>

          {code ? (
            <View style={styles.codeBox}>
              <Text style={styles.codeLabel}>Código</Text>
              <Text style={styles.codeValue}>{code}</Text>
            </View>
          ) : null}

          <View style={{ height: 14 }} />

          <Pressable style={styles.primaryBtn} onPress={onRetry}>
            <Ionicons name="refresh-outline" size={18} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>Tentar novamente</Text>
          </Pressable>

          <View style={{ height: 10 }} />

          <Pressable style={styles.ghostBtn} onPress={onSupport}>
            <Ionicons name="help-circle-outline" size={18} color="#111827" />
            <Text style={styles.ghostBtnText}>Precisas de ajuda?</Text>
          </Pressable>

          <View style={{ height: 10 }} />

          <Pressable
            style={styles.linkBtn}
            onPress={() => router.replace("/(tabs)" as any)}
          >
            <Text style={styles.linkBtnText}>Voltar ao início</Text>
          </Pressable>
        </View>

        <View style={styles.tipCard}>
          <View style={styles.tipIcon}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color="#2563EB"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tipTitle}>Dicas rápidas</Text>
            <Text style={styles.tipText}>
              Confirma o método de pagamento, tenta novamente e verifica se o
              teu banco não bloqueou a transação.
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  screenTitle: { fontSize: 18, fontWeight: "900", color: "#111827" },
  screenSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "700",
  },

  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEF2F7",
    alignItems: "center",
    justifyContent: "center",
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

  container: { padding: 16, gap: 12 },

  card: {
    borderRadius: 18,
    padding: 16,
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

  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  title: { fontSize: 18, fontWeight: "900", color: "#111827" },
  text: {
    marginTop: 6,
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "700",
    lineHeight: 18,
  },

  codeBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
  },
  codeLabel: { fontSize: 11, color: "#6B7280", fontWeight: "800" },
  codeValue: {
    marginTop: 4,
    fontSize: 13,
    color: "#111827",
    fontWeight: "900",
  },

  primaryBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  primaryBtnText: { color: "#FFFFFF", fontWeight: "900" },

  ghostBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  ghostBtnText: { color: "#111827", fontWeight: "900" },

  linkBtn: {
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  linkBtnText: { color: "#6B7280", fontWeight: "900" },

  tipCard: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEF2F7",
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 1 },
    }),
  },
  tipIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  tipTitle: { fontSize: 13, fontWeight: "900", color: "#111827" },
  tipText: {
    marginTop: 4,
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "700",
    lineHeight: 17,
  },
});
