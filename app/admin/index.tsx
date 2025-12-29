import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  Platform,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { api } from "@/hooks/services/api";
import { getPlans } from "@/hooks/services/subscription";
import { SelectInput } from "@/components/SelectInput";
import type { SubscriptionPlanDto } from "@/types/models";

type TabKey = "users" | "properties";

function Chip({ text }: { text: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{text}</Text>
    </View>
  );
}

function Segmented({
  value,
  onChange,
}: {
  value: TabKey;
  onChange: (v: TabKey) => void;
}) {
  return (
    <View style={styles.segmentWrap}>
      <Pressable
        onPress={() => onChange("users")}
        style={[
          styles.segmentBtn,
          value === "users" && styles.segmentBtnActive,
        ]}
      >
        <Text
          style={[
            styles.segmentText,
            value === "users" && styles.segmentTextActive,
          ]}
        >
          Utilizadores
        </Text>
      </Pressable>

      <Pressable
        onPress={() => onChange("properties")}
        style={[
          styles.segmentBtn,
          value === "properties" && styles.segmentBtnActive,
        ]}
      >
        <Text
          style={[
            styles.segmentText,
            value === "properties" && styles.segmentTextActive,
          ]}
        >
          Imóveis
        </Text>
      </Pressable>
    </View>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

function Input({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  icon?: any;
}) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        {icon ? (
          <View style={styles.inputIcon}>
            <Ionicons name={icon} size={16} color="#6B7280" />
          </View>
        ) : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          style={[styles.input, icon ? { paddingLeft: 38 } : null]}
          autoCapitalize="none"
        />
      </View>
    </View>
  );
}

function Row({
  title,
  subtitle,
  leftIcon,
  badge,
  onPress,
}: {
  title: string;
  subtitle?: string;
  leftIcon: any;
  badge?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.rowIcon}>
        <Ionicons name={leftIcon} size={18} color="#2563EB" />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.rowSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {badge ? <Chip text={badge} /> : null}
      <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
    </Pressable>
  );
}

export default function AdminScreen() {
  const router = useRouter();

  const [tab, setTab] = useState<TabKey>("users");

  const [users, setUsers] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [userQueryInput, setUserQueryInput] = useState("");
  const [userEmailInput, setUserEmailInput] = useState("");
  const [userPlanInput, setUserPlanInput] = useState("");
  const [propertyQueryInput, setPropertyQueryInput] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPlan, setUserPlan] = useState("");
  const [propertyQuery, setPropertyQuery] = useState("");
  const [plans, setPlans] = useState<SubscriptionPlanDto[]>([]);

  const [userPage, setUserPage] = useState(1);
  const [propertyPage, setPropertyPage] = useState(1);

  const usersCount = users.length;
  const propsCount = properties.length;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const usersRes = await api.get("/user/paged", {
        params: {
          page: userPage,
          pageSize: 20,
          query: userQuery || undefined,
          email: userEmail || undefined,
          plan: userPlan || undefined,
        },
      });

      const propsRes = await api.get("/property/paged", {
        params: {
          page: propertyPage,
          pageSize: 20,
          query: propertyQuery || undefined,
        },
      });
      console.log({ users: usersRes.data });
      setUsers(usersRes.data.items ?? []);
      setProperties(propsRes.data.items ?? []);
    } catch (err) {
      // TODO: add Alert component if you want
    } finally {
      setLoading(false);
    }
  }, [userPage, userQuery, userEmail, userPlan, propertyPage, propertyQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchPlans = useCallback(async () => {
    try {
      const plansRes = await getPlans();
      setPlans(plansRes ?? []);
    } catch (err) {
      // TODO: add Alert component if you want
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchData(), fetchPlans()]);
    setRefreshing(false);
  }, [fetchData, fetchPlans]);

  const activeCountText = useMemo(() => {
    if (tab === "users") return `${usersCount} resultados`;
    return `${propsCount} resultados`;
  }, [tab, usersCount, propsCount]);

  const planOptions = useMemo(
    () => [
      { label: "Todos os planos", value: "" },
      ...plans.map((plan) => ({
        label: plan.name || plan.code,
        value: plan.code,
      })),
    ],
    [plans]
  );

  const resetUserFilters = () => {
    setUserQueryInput("");
    setUserEmailInput("");
    setUserPlanInput("");
    setUserQuery("");
    setUserEmail("");
    setUserPlan("");
    setUserPage(1);
  };

  const resetPropertyFilters = () => {
    setPropertyQueryInput("");
    setPropertyQuery("");
    setPropertyPage(1);
  };

  const applyUserFilters = () => {
    setUserQuery(userQueryInput);
    setUserEmail(userEmailInput);
    setUserPlan(userPlanInput);
    setUserPage(1);
  };

  const applyPropertyFilters = () => {
    setPropertyQuery(propertyQueryInput);
    setPropertyPage(1);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>A carregar admin…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable
            style={styles.iconBtn}
            onPress={() => router.back()}
            hitSlop={10}
          >
            <Ionicons name="chevron-back" size={18} color="#111827" />
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text style={styles.screenTitle}>Admin</Text>
            <Text style={styles.screenSubtitle}>{activeCountText}</Text>
          </View>

          <Pressable
            style={styles.iconBtn}
            onPress={() => {
              // quick scroll to top / future: open tools
            }}
            hitSlop={10}
          >
            <Ionicons name="options-outline" size={18} color="#111827" />
          </Pressable>
        </View>

        {/* Tabs */}
        <Segmented value={tab} onChange={setTab} />

        {/* Filters */}
        <View style={{ marginTop: 12 }}>
          <Text style={styles.sectionTitle}>Filtros</Text>

          <Card>
            {tab === "users" ? (
              <>
                <Input
                  label="Pesquisa"
                  value={userQueryInput}
                  onChangeText={setUserQueryInput}
                  placeholder="nome, id, etc…"
                  icon="search-outline"
                />

                <Input
                  label="Email"
                  value={userEmailInput}
                  onChangeText={setUserEmailInput}
                  placeholder="ex: user@email.com"
                  icon="mail-outline"
                />

                <SelectInput
                  label="Plano"
                  placeholder="Todos os planos"
                  options={planOptions}
                  value={userPlanInput}
                  onChange={(v) => {
                    setUserPlanInput(v);
                  }}
                />

                <View style={styles.filterActions}>
                  <Pressable style={styles.ghostBtn} onPress={resetUserFilters}>
                    <Text style={styles.ghostBtnText}>Limpar</Text>
                  </Pressable>

                  <Pressable
                    style={styles.primaryBtn}
                    onPress={applyUserFilters}
                  >
                    <Text style={styles.primaryBtnText}>Aplicar</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <Input
                  label="Pesquisa"
                  value={propertyQueryInput}
                  onChangeText={setPropertyQueryInput}
                  placeholder="nome, rua, id…"
                  icon="search-outline"
                />

                <View style={styles.filterActions}>
                  <Pressable
                    style={styles.ghostBtn}
                    onPress={resetPropertyFilters}
                  >
                    <Text style={styles.ghostBtnText}>Limpar</Text>
                  </Pressable>

                  <Pressable
                    style={styles.primaryBtn}
                    onPress={applyPropertyFilters}
                  >
                    <Text style={styles.primaryBtnText}>Aplicar</Text>
                  </Pressable>
                </View>
              </>
            )}
          </Card>
        </View>

        {/* Results */}
        <View style={{ marginTop: 12 }}>
          <Text style={styles.sectionTitle}>Resultados</Text>

          <Card>
            {tab === "users" ? (
              <>
                {users.map((u, idx) => (
                  <View key={`u-${u.id ?? idx}`}>
                    <Row
                      leftIcon="person-outline"
                      title={u.name || u.email || "Utilizador"}
                      subtitle={u.email || u.id}
                      badge={
                        (u.planName || u.plan || "").toUpperCase() || undefined
                      }
                      onPress={() => {
                        // optional: navigate to admin user detail page
                        // router.push({ pathname: "/admin/user", params: { id: u.id } })
                      }}
                    />
                    {idx < users.length - 1 ? (
                      <View style={styles.divider} />
                    ) : null}
                  </View>
                ))}

                {users.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Ionicons name="person-outline" size={28} color="#9CA3AF" />
                    <Text style={styles.emptyTitle}>Sem utilizadores</Text>
                    <Text style={styles.emptyText}>
                      Ajusta os filtros e tenta novamente.
                    </Text>
                  </View>
                ) : null}

                <View style={styles.pager}>
                  <Pressable
                    onPress={() => setUserPage((p) => Math.max(1, p - 1))}
                    style={[
                      styles.pagerBtn,
                      userPage === 1 && styles.pagerBtnDisabled,
                    ]}
                    disabled={userPage === 1}
                  >
                    <Ionicons name="chevron-back" size={16} color="#111827" />
                    <Text style={styles.pagerText}>Anterior</Text>
                  </Pressable>

                  <Text style={styles.pageText}>Página {userPage}</Text>

                  <Pressable
                    onPress={() => setUserPage((p) => p + 1)}
                    style={styles.pagerBtn}
                  >
                    <Text style={styles.pagerText}>Seguinte</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="#111827"
                    />
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                {properties.map((p, idx) => (
                  <View key={`p-${p.id ?? idx}`}>
                    <Row
                      leftIcon="home-outline"
                      title={p.name || "Imóvel"}
                      subtitle={p.streetName || p.id}
                      badge={p.type ? String(p.type).toUpperCase() : undefined}
                      onPress={() => {
                        // optional: open property screen
                        // router.push({ pathname: "/property/details", params: { id: p.id } })
                      }}
                    />
                    {idx < properties.length - 1 ? (
                      <View style={styles.divider} />
                    ) : null}
                  </View>
                ))}

                {properties.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Ionicons name="home-outline" size={28} color="#9CA3AF" />
                    <Text style={styles.emptyTitle}>Sem imóveis</Text>
                    <Text style={styles.emptyText}>
                      Ajusta os filtros e tenta novamente.
                    </Text>
                  </View>
                ) : null}

                <View style={styles.pager}>
                  <Pressable
                    onPress={() => setPropertyPage((p) => Math.max(1, p - 1))}
                    style={[
                      styles.pagerBtn,
                      propertyPage === 1 && styles.pagerBtnDisabled,
                    ]}
                    disabled={propertyPage === 1}
                  >
                    <Ionicons name="chevron-back" size={16} color="#111827" />
                    <Text style={styles.pagerText}>Anterior</Text>
                  </Pressable>

                  <Text style={styles.pageText}>Página {propertyPage}</Text>

                  <Pressable
                    onPress={() => setPropertyPage((p) => p + 1)}
                    style={styles.pagerBtn}
                  >
                    <Text style={styles.pagerText}>Seguinte</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="#111827"
                    />
                  </Pressable>
                </View>
              </>
            )}
          </Card>
        </View>

        <View style={{ height: 18 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { padding: 16, paddingBottom: 24 },

  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  loadingText: { color: "#6B7280", fontWeight: "800" },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
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

  segmentWrap: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEF2F7",
    borderRadius: 16,
    padding: 4,
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
  segmentBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentBtnActive: { backgroundColor: "#111827" },
  segmentText: { fontSize: 13, fontWeight: "900", color: "#111827" },
  segmentTextActive: { color: "#FFFFFF" },

  sectionTitle: {
    marginTop: 14,
    marginBottom: 10,
    fontSize: 16,
    fontWeight: "900",
    color: "#111827",
  },

  card: {
    borderRadius: 18,
    padding: 14,
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

  label: { fontSize: 12, fontWeight: "900", color: "#111827", marginBottom: 6 },

  inputWrap: { position: "relative" },
  inputIcon: {
    position: "absolute",
    left: 12,
    top: 12,
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111827",
  },

  filterActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  ghostBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  ghostBtnText: { fontWeight: "900", color: "#111827" },

  primaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { fontWeight: "900", color: "#FFFFFF" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { fontSize: 13, fontWeight: "900", color: "#111827" },
  rowSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "700",
  },
  divider: { height: 1, backgroundColor: "#EEF2F7" },

  chip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
  },
  chipText: { fontSize: 12, fontWeight: "900", color: "#111827" },

  emptyBox: { paddingVertical: 18, alignItems: "center", gap: 8 },
  emptyTitle: { fontSize: 14, fontWeight: "900", color: "#111827" },
  emptyText: { fontSize: 12, color: "#6B7280", fontWeight: "700" },

  pager: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  pagerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
  },
  pagerBtnDisabled: { opacity: 0.5 },
  pagerText: { fontSize: 12, fontWeight: "900", color: "#111827" },
  pageText: { fontSize: 12, fontWeight: "900", color: "#6B7280" },
});
