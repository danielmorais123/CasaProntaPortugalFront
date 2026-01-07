import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  Alert as RNAlert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { verifyPassword } from "@/hooks/services/auth";

function ErrorCard({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <View style={styles.errorBox}>
      <View style={styles.errorIcon}>
        <Ionicons name="alert-circle" size={18} color="#B91C1C" />
      </View>
      <Text style={styles.errorText}>{message}</Text>
      <Pressable onPress={onClose} style={styles.errorClose}>
        <Ionicons name="close" size={18} color="#64748B" />
      </Pressable>
    </View>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <View style={styles.infoBox}>
      <View style={styles.infoIcon}>
        <Ionicons name="shield-checkmark-outline" size={18} color="#1D4ED8" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoText}>{text}</Text>
      </View>
    </View>
  );
}

function AuthInput({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
}: {
  icon: any;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  secureTextEntry?: boolean;
}) {
  return (
    <View style={styles.inputWrap}>
      <View style={styles.inputIcon}>
        <Ionicons name={icon} size={18} color="#2563EB" />
      </View>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
      />
    </View>
  );
}

function SectionTitle({
  icon,
  title,
  subtitle,
}: {
  icon: any;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={{ marginBottom: 10 }}>
      <View style={styles.sectionTitleRow}>
        <View style={styles.sectionIcon}>
          <Ionicons name={icon} size={18} color="#1D4ED8" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle ? (
            <Text style={styles.sectionSubtitle}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function SettingRow({
  icon,
  title,
  subtitle,
  right,
  onPress,
  danger,
}: {
  icon: any;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[
        styles.settingRow,
        danger && { borderColor: "#FECACA", backgroundColor: "#FFF5F5" },
      ]}
    >
      <View
        style={[
          styles.settingIcon,
          danger && { backgroundColor: "#FEE2E2", borderColor: "#FECACA" },
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={danger ? "#B91C1C" : "#2563EB"}
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.settingTitle, danger && { color: "#7F1D1D" }]}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[styles.settingSubtitle, danger && { color: "#991B1B" }]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {right ? (
        right
      ) : (
        <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
      )}
    </Pressable>
  );
}

export default function SecurityScreen() {
  const router = useRouter();

  // Gate
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [error, setError] = useState("");

  // Settings state (exemplo UI; liga ao teu BE se quiseres)
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);

  const handleUnlock = async () => {
    if (!password) {
      setError("Insira a sua password para continuar.");
      return;
    }
    setUnlockLoading(true);
    setError("");
    try {
      const ok = await verifyPassword(password);
      if (!ok.valid) {
        setError("Password incorreta. Tente novamente.");
        return;
      }
      setUnlocked(true);
      setPassword("");
    } catch (e: any) {
      setError(
        e?.response?.data?.message || "Não foi possível validar a password."
      );
    } finally {
      setUnlockLoading(false);
    }
  };

  const lockAgain = () => {
    setUnlocked(false);
    setPassword("");
    setError("");
  };

  const confirmDanger = (
    title: string,
    message: string,
    onConfirm: () => void
  ) => {
    RNAlert.alert(title, message, [
      { text: "Cancelar", style: "cancel" },
      { text: "Confirmar", style: "destructive", onPress: onConfirm },
    ]);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Top bar */}
          <View style={styles.topRow}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={18} color="#0F172A" />
              <Text style={styles.backText}>Voltar</Text>
            </Pressable>

            {unlocked ? (
              <Pressable onPress={lockAgain} style={styles.lockBtn}>
                <Ionicons
                  name="lock-closed-outline"
                  size={16}
                  color="#0F172A"
                />
                <Text style={styles.lockText}>Bloquear</Text>
              </Pressable>
            ) : null}
          </View>

          {/* Header */}
          <View style={styles.headerCard}>
            <View style={styles.headerIcon}>
              <Ionicons
                name="shield-checkmark-outline"
                size={22}
                color="#1D4ED8"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Segurança</Text>
              <Text style={styles.headerSub}>
                Proteja a sua conta e mantenha o acesso sob controlo.
              </Text>
            </View>
          </View>

          {!!error && (
            <ErrorCard message={error} onClose={() => setError("")} />
          )}

          {/* Gate card */}
          {!unlocked ? (
            <View style={styles.card}>
              <SectionTitle
                icon="key-outline"
                title="Confirmar identidade"
                subtitle="Para aceder às definições de segurança, confirme a sua password."
              />

              <AuthInput
                icon="lock-closed-outline"
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <View style={{ height: 14 }} />
              <Button
                title={unlockLoading ? "A validar…" : "Continuar"}
                onPress={handleUnlock}
                loading={unlockLoading}
              />

              <View style={{ height: 10 }} />
              <Button
                variant="ghost"
                title="Esqueci-me da password"
                onPress={() => router.push("/(auth)/request-password")}
              />

              <View style={{ height: 10 }} />
              <InfoCard
                title="Privacidade"
                text="Não mostramos estas opções sem validação, mesmo que alguém tenha acesso ao seu telemóvel."
              />
            </View>
          ) : (
            <>
              {/* Security settings */}
              <View style={styles.card}>
                <SectionTitle
                  icon="lock-open-outline"
                  title="Definições de segurança"
                  subtitle="Gerir acesso, autenticação e ações sensíveis."
                />

                <SettingRow
                  icon="key-outline"
                  title="Alterar password"
                  subtitle="Recomendado a cada 3–6 meses"
                />

                <View style={styles.divider} />

                <SettingRow
                  icon="notifications-outline"
                  title="Alertas de segurança por email"
                  subtitle="Login em novo dispositivo / ações críticas"
                  right={
                    <Switch
                      value={emailAlerts}
                      onValueChange={setEmailAlerts}
                      trackColor={{ false: "#E2E8F0", true: "#BFDBFE" }}
                      thumbColor={emailAlerts ? "#2563EB" : "#94A3B8"}
                    />
                  }
                />
              </View>

              {/* Sessions / device */}
              <View style={styles.card}>
                <SectionTitle
                  icon="phone-portrait-outline"
                  title="Sessões"
                  subtitle="Controlar dispositivos com sessão ativa."
                />

                {/* <SettingRow
                  icon="log-out-outline"
                  title="Terminar sessão em todos os dispositivos"
                  subtitle="Revoga todas as sessões ativas"
                  danger
                  onPress={() =>
                    confirmDanger(
                      "Terminar sessões",
                      "Tem a certeza que quer terminar sessão em todos os dispositivos?",
                      async () => {
                        // TODO: chama o teu endpoint, exemplo:
                        // await api.post("/auth/logout-all");
                        RNAlert.alert(
                          "Feito",
                          "Sessões terminadas (exemplo UI)."
                        );
                      }
                    )
                  }
                /> */}

                <View style={styles.divider} />

                <SettingRow
                  icon="trash-outline"
                  title="Eliminar conta"
                  subtitle="Ação permanente (irreversível)"
                  danger
                  onPress={() =>
                    confirmDanger(
                      "Eliminar conta",
                      "Isto vai eliminar a sua conta e dados. Tem a certeza?",
                      async () => {
                        // TODO: chama o teu endpoint, exemplo:
                        // await api.delete("/account");
                        RNAlert.alert("Feito", "Conta eliminada (exemplo UI).");
                      }
                    )
                  }
                />
              </View>

              {/* Footer / lock */}
              <View style={styles.footerCard}>
                <Ionicons
                  name="lock-closed-outline"
                  size={16}
                  color="#64748B"
                />
                <Text style={styles.footerText}>
                  Para sua segurança, pode bloquear esta página a qualquer
                  momento.
                </Text>
                <Pressable onPress={lockAgain} style={styles.footerPill}>
                  <Text style={styles.footerPillText}>Bloquear</Text>
                </Pressable>
              </View>
            </>
          )}
        </ScrollView>

        {unlockLoading ? (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator />
          </View>
        ) : null}
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    paddingBottom: 28,
    gap: 14,
    backgroundColor: "#F8FAFC",
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  backText: { fontWeight: "900", color: "#0F172A", fontSize: 12 },
  lockBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  lockText: { fontWeight: "900", color: "#0F172A", fontSize: 12 },

  headerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#DBEAFE",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "900", color: "#0F172A" },
  headerSub: { marginTop: 4, fontSize: 12, color: "#64748B", lineHeight: 16 },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  sectionTitleRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  sectionIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: { fontSize: 14, fontWeight: "900", color: "#0F172A" },
  sectionSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748B",
    lineHeight: 16,
  },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  inputIcon: {
    width: 30,
    height: 30,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
  },
  input: { flex: 1, fontSize: 14, color: "#0F172A", fontWeight: "700" },

  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  settingIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
  },
  settingTitle: { fontSize: 13, fontWeight: "900", color: "#0F172A" },
  settingSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: "#64748B",
    lineHeight: 16,
  },

  divider: { height: 10 },

  footerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  footerText: {
    flex: 1,
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
    lineHeight: 16,
  },
  footerPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  footerPillText: { fontSize: 12, fontWeight: "900", color: "#0F172A" },

  infoBox: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginTop: 10,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DBEAFE",
  },
  infoTitle: { fontWeight: "900", color: "#1D4ED8", fontSize: 13 },
  infoText: {
    marginTop: 4,
    color: "#475569",
    fontWeight: "600",
    fontSize: 12,
    lineHeight: 16,
  },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  errorIcon: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
  },
  errorText: {
    flex: 1,
    color: "#991B1B",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
  },
  errorClose: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  loadingOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 18,
    alignItems: "center",
    opacity: 0.5,
  },
});
