// ProfileScreen.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  ScrollView,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/Button";
import { Alert } from "@/components/Alert";
import { me } from "@/hooks/services/auth";
import { useRouter } from "expo-router";

function ProfileScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [alertMessage, setAlertMessage] = useState<{
    type: "success" | "destructive";
    message: string;
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchProfile = useCallback(async () => {
    try {
      const res = await me();
      setName(res.user.name);
      setEmail(res.user.email);
      // If you have birthDate in the response, set it here
      // setBirthDate(new Date(res.user.birthDate));
    } catch (e) {
      // handle error if needed
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  }, [fetchProfile]);

  const handleSave = () => {
    setAlertMessage({
      type: "success",
      message: "Perfil atualizado com sucesso!",
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {alertMessage && (
          <Alert
            variant={
              alertMessage.type === "success" ? "success" : "destructive"
            }
            title={alertMessage.message}
          />
        )}

        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: "https://i.pravatar.cc/150?img=3" }}
            style={styles.avatar}
          />
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.email}>{email}</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Nome</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Nome completo"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            keyboardType="email-address"
          />

          <Button title="Guardar Alterações" onPress={handleSave} />
          <Button
            variant="ghost"
            title="Voltar à página inicial"
            onPress={() => router.push("/")}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#F8FAFC",
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  name: {
    fontSize: 20,
    fontWeight: "600",
    color: "#0F172A",
  },
  email: {
    fontSize: 14,
    color: "#64748B",
  },
  form: {
    marginBottom: 30,
    display: "flex",
    gap: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#475569",
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#0F172A",
  },
});
export default ProfileScreen;
