import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPlans,
  updateUserSubscription,
} from "@/hooks/services/subscription";
import { SelectInput } from "@/components/SelectInput";
import { getPagedUsers } from "@/hooks/services/user";
import { getPagedProperties } from "@/hooks/services/property";

type TabKey = "users" | "properties";

export default function AdminScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<TabKey>("users");

  const [userQuery, setUserQuery] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPlan, setUserPlan] = useState("");
  const [propertyQuery, setPropertyQuery] = useState("");

  const [userPage, setUserPage] = useState(1);
  const [propertyPage, setPropertyPage] = useState(1);

  const [planSelection, setPlanSelection] = useState<Record<string, string>>(
    {}
  );
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const { data: plans = [] } = useQuery({
    queryKey: ["plans"],
    queryFn: getPlans,
  });

  const {
    data: usersData,
    isLoading: usersLoading,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ["admin-users", userPage, userQuery, userEmail, userPlan],
    queryFn: () =>
      getPagedUsers({
        page: userPage,
        pageSize: 20,
        query: userQuery || undefined,
        email: userEmail || undefined,
        plan: userPlan || undefined,
      }),
  });

  const {
    data: propertiesData,
    isLoading: propertiesLoading,
    refetch: refetchProperties,
  } = useQuery({
    queryKey: ["admin-properties", propertyPage, propertyQuery],
    queryFn: () =>
      getPagedProperties({
        page: propertyPage,
        pageSize: 20,
        query: propertyQuery || undefined,
      }),
  });

  const users = usersData?.items ?? [];
  const properties = propertiesData?.items ?? [];

  const updatePlan = useMutation({
    mutationFn: async ({
      userId,
      planCode,
    }: {
      userId: string;
      planCode: string;
    }) => updateUserSubscription(planCode),
    onMutate: ({ userId }) => setUpdatingUserId(userId),
    onSettled: () => setUpdatingUserId(null),
    onSuccess: () => {
      refetchUsers();
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });

  const planOptions = useMemo(
    () =>
      plans.map((p) => ({
        label: p.name || p.code,
        value: p.code,
      })),
    [plans]
  );

  const loading = usersLoading || propertiesLoading;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>A carregar admin…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {
              refetchUsers();
              refetchProperties();
            }}
          />
        }
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} />
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Admin</Text>
            <Text style={styles.subtitle}>
              Gestão de utilizadores e imóveis
            </Text>
          </View>
        </View>

        {/* TABS */}
        <View style={styles.tabs}>
          {["users", "properties"].map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t as TabKey)}
              style={[styles.tab, tab === t && styles.tabActive]}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === "users" ? "Utilizadores" : "Imóveis"}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* FILTER CARD */}
        <View style={styles.filterCard}>
          <Text style={styles.cardTitle}>Filtros</Text>

          {tab === "users" ? (
            <>
              <Input
                placeholder="Pesquisar utilizador"
                icon="search-outline"
                value={userQuery}
                onChangeText={setUserQuery}
              />
              <Input
                placeholder="Email"
                icon="mail-outline"
                value={userEmail}
                onChangeText={setUserEmail}
              />
              <SelectInput
                label="Plano"
                options={[{ label: "Todos", value: "" }, ...planOptions]}
                value={userPlan}
                onChange={setUserPlan}
              />
            </>
          ) : (
            <Input
              placeholder="Pesquisar imóvel"
              icon="search-outline"
              value={propertyQuery}
              onChangeText={setPropertyQuery}
            />
          )}
        </View>

        {/* RESULTS */}
        <View style={{ gap: 12 }}>
          {tab === "users"
            ? users.map((u) => (
                <View key={u.id} style={styles.resultCard}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="person-outline" size={20} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitleText}>
                        {u.name || u.email}
                      </Text>
                      <Text style={styles.cardSubtitle}>{u.email}</Text>
                    </View>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {(u.planName || "").toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardActions}>
                    <SelectInput
                      label="Plano"
                      options={planOptions}
                      value={planSelection[u.id] ?? u.plan}
                      onChange={(v) =>
                        setPlanSelection((p) => ({ ...p, [u.id]: v }))
                      }
                    />
                    <Pressable
                      style={styles.primaryBtn}
                      disabled={updatingUserId === u.id}
                      onPress={() =>
                        updatePlan.mutate({
                          userId: u.id,
                          planCode: planSelection[u.id],
                        })
                      }
                    >
                      <Text style={styles.primaryBtnText}>
                        {updatingUserId === u.id ? "A atualizar…" : "Atualizar"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))
            : properties.map((p) => (
                <View key={p.id} style={styles.resultCard}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="home-outline" size={20} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitleText}>{p.name}</Text>
                      <Text style={styles.cardSubtitle}>{p.streetName}</Text>
                    </View>
                    <View style={styles.badgeMuted}>
                      <Text style={styles.badgeMutedText}>
                        {String(p.type)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Input({
  placeholder,
  value,
  onChangeText,
  icon,
}: {
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  icon?: any;
}) {
  return (
    <View style={styles.inputWrap}>
      {icon && <Ionicons name={icon} size={16} color="#6B7280" />}
      <TextInput
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
        placeholderTextColor="#9CA3AF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { padding: 16, paddingBottom: 32 },

  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  loadingText: { fontWeight: "800", color: "#6B7280" },

  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 24, fontWeight: "900" },
  subtitle: { color: "#6B7280", fontWeight: "700", marginTop: 4 },

  tabs: { flexDirection: "row", gap: 10, marginTop: 20 },
  tab: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  tabActive: { backgroundColor: "#111827" },
  tabText: { fontWeight: "900", color: "#111827" },
  tabTextActive: { color: "#FFF" },

  filterCard: {
    marginTop: 20,
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },

  resultCard: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 16,
  },

  cardHeader: { flexDirection: "row", gap: 12, alignItems: "center" },
  cardTitleText: { fontWeight: "900", fontSize: 15 },
  cardSubtitle: { color: "#6B7280", fontSize: 12 },

  badge: {
    backgroundColor: "#111827",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { color: "#FFF", fontWeight: "900", fontSize: 11 },

  badgeMuted: {
    backgroundColor: "#E5E7EB",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeMutedText: { fontWeight: "900", fontSize: 11 },

  cardActions: { marginTop: 12, gap: 10 },

  primaryBtn: {
    height: 44,
    borderRadius: 14,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#FFF", fontWeight: "900" },

  inputWrap: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    alignItems: "center",
  },
  input: { flex: 1, fontSize: 14 },
});
