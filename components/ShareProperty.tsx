import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/hooks/services/api";
import { AutocompleteInput } from "./AutocompleteInput";
import { SelectInput } from "./SelectInput";
import { DateInput } from "./DateInput";
import { searchUsers as searchUsersFn } from "@/hooks/services/user";
import { Button } from "@/components/Button";

type BannerTone = "success" | "error" | null;

function Banner({
  tone,
  message,
  onClose,
}: {
  tone: BannerTone;
  message: string;
  onClose: () => void;
}) {
  if (!tone) return null;

  const isSuccess = tone === "success";

  return (
    <View
      style={[
        styles.banner,
        isSuccess ? styles.bannerSuccess : styles.bannerError,
      ]}
    >
      <View
        style={[
          styles.bannerIcon,
          isSuccess ? styles.bannerIconSuccess : styles.bannerIconError,
        ]}
      >
        <Ionicons
          name={isSuccess ? "checkmark" : "alert"}
          size={16}
          color={isSuccess ? "#065F46" : "#7F1D1D"}
        />
      </View>

      <Text
        style={[
          styles.bannerText,
          isSuccess ? { color: "#065F46" } : { color: "#7F1D1D" },
        ]}
      >
        {message}
      </Text>

      <Pressable onPress={onClose} hitSlop={10} style={styles.bannerClose}>
        <Ionicons name="close" size={16} color="#666" />
      </Pressable>
    </View>
  );
}

export function ShareProperty({ propertyId }: { propertyId: string }) {
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [permissionLevel, setPermissionLevel] = useState("2");
  const [expiresAt, setExpiresAt] = useState<string | Date | null>("");
  const [banner, setBanner] = useState<{ tone: BannerTone; message: string }>({
    tone: null,
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const searchUsers = async (query: string) => {
    if (!query) return [];
    return await searchUsersFn(query);
  };

  const permissionText = useMemo(
    () => (permissionLevel === "2" ? "Gestão" : "Leitura"),
    [permissionLevel]
  );

  const expiresAsString = useMemo(() => {
    if (!expiresAt) return "";
    if (typeof expiresAt === "string") return expiresAt;
    return expiresAt.toISOString().slice(0, 10);
  }, [expiresAt]);

  const handleShare = async () => {
    if (!selectedUser) {
      setBanner({ tone: "error", message: "Selecione um utilizador." });
      return;
    }

    setSubmitting(true);
    setBanner({ tone: null, message: "" });

    try {
      await api.post(`/properties/${propertyId}/permissions/share`, {
        userId: selectedUser.id,
        permissionLevel: Number(permissionLevel),
        expiresAt: expiresAsString || null,
      });

      setBanner({
        tone: "success",
        message: `Partilhado com ${selectedUser.label} (${permissionText}).`,
      });

      // reset (opcional)
      setSelectedUser(null);
      setPermissionLevel("2");
      setExpiresAt("");
    } catch {
      setBanner({ tone: "error", message: "Erro ao partilhar imóvel." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderIcon}>
          <Ionicons name="people-outline" size={18} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>Convidar utilizador</Text>
          <Text style={styles.cardSub}>
            Pesquisa por email, define permissões e (opcional) validade.
          </Text>
        </View>
      </View>

      <Banner
        tone={banner.tone}
        message={banner.message}
        onClose={() => setBanner({ tone: null, message: "" })}
      />

      {/* ✅ Autocomplete (icon inside input) */}
      <AutocompleteInput
        label="Email do utilizador"
        placeholder="Pesquisar utilizador por email"
        searchFn={searchUsers}
        onSelect={setSelectedUser}
        iconName="person-outline"
        disabled={submitting}
      />

      {selectedUser ? (
        <View style={styles.selectedChip}>
          <Ionicons name="checkmark-circle" size={16} color="#0F766E" />
          <Text style={styles.selectedText} numberOfLines={1}>
            {selectedUser.label}
          </Text>

          <Pressable
            onPress={() => setSelectedUser(null)}
            style={styles.selectedClear}
            hitSlop={10}
          >
            <Ionicons name="close" size={16} color="#065F46" />
          </Pressable>
        </View>
      ) : (
        <Text style={styles.helper}>
          Escreve e escolhe um utilizador da lista.
        </Text>
      )}

      {/* ✅ Select (keep your SelectInput, already has icon on the right) */}
      <SelectInput
        label="Nível de permissão"
        options={[
          { label: "Leitura", value: "1" },
          { label: "Gestão", value: "2" },
        ]}
        value={permissionLevel}
        onChange={setPermissionLevel}
      />

      {/* ✅ DateInput (icon inside input already) */}
      <DateInput
        label="Validade (opcional)"
        value={expiresAsString}
        onChange={setExpiresAt}
        placeholder="Selecionar data"
      />

      <Text style={styles.helper}>
        Se não definires validade, o acesso fica ativo até removeres a partilha.
      </Text>

      <View style={{ height: 14 }} />

      <Button
        variant="default"
        title={submitting ? "A partilhar…" : "Partilhar imóvel"}
        onPress={handleShare}
        disabled={submitting}
        loading={submitting}
      />

      {submitting ? (
        <View style={styles.sendingRow}>
          <ActivityIndicator />
          <Text style={styles.sendingText}>A enviar convite…</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: "#EAEAEA",
    borderRadius: 16,
    padding: 14,
    backgroundColor: "#fff",
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  cardHeaderIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 15, fontWeight: "900", color: "#111" },
  cardSub: {
    marginTop: 6,
    fontSize: 13,
    color: "#666",
    fontWeight: "700",
    lineHeight: 18,
  },

  helper: {
    marginTop: -6,
    marginBottom: 12,
    fontSize: 12,
    fontWeight: "700",
    color: "#666",
    lineHeight: 18,
  },

  selectedChip: {
    marginTop: -6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#A7F3D0",
    backgroundColor: "#ECFDF5",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  selectedText: {
    flex: 1,
    fontWeight: "900",
    color: "#065F46",
    fontSize: 13,
  },
  selectedClear: {
    width: 34,
    height: 34,
    borderRadius: 14,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
  },

  // banner
  banner: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bannerSuccess: { borderColor: "#A7F3D0", backgroundColor: "#ECFDF5" },
  bannerError: { borderColor: "#FECACA", backgroundColor: "#FEF2F2" },
  bannerIcon: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerIconSuccess: { backgroundColor: "#D1FAE5" },
  bannerIconError: { backgroundColor: "#FEE2E2" },
  bannerText: { flex: 1, fontWeight: "900", fontSize: 12.5, lineHeight: 18 },
  bannerClose: {
    width: 34,
    height: 34,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EAEAEA",
    alignItems: "center",
    justifyContent: "center",
  },

  sendingRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sendingText: { fontWeight: "800", color: "#666" },
});
