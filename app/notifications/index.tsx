import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

type NotificationType = "document" | "alert" | "system";

type Notification = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  type: NotificationType;
};

export default function NotificationsScreen() {
  const [refreshing, setRefreshing] = useState(false);

  // 🔹 Mock (depois ligas à API)
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "Certificado energético a expirar",
      message:
        "O certificado energético da casa da Rua das Flores expira em 30 dias.",
      createdAt: "2025-01-12T10:30:00Z",
      isRead: false,
      type: "document",
    },
    {
      id: "2",
      title: "Novo documento adicionado",
      message: "Foi adicionado um novo documento ao imóvel Apartamento Lisboa.",
      createdAt: "2025-01-10T18:12:00Z",
      isRead: true,
      type: "system",
    },
  ]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);

    // 🔄 aqui depois chamas a API
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const renderIcon = (type: NotificationType) => {
    switch (type) {
      case "document":
        return "document-text-outline";
      case "alert":
        return "warning-outline";
      default:
        return "notifications-outline";
    }
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <Pressable
      onPress={() => markAsRead(item.id)}
      style={[styles.card, !item.isRead && styles.unreadCard]}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={renderIcon(item.type)}
          size={22}
          color={item.isRead ? "#6B7280" : "#2563EB"}
        />
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, !item.isRead && styles.unreadTitle]}>
          {item.title}
        </Text>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.date}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notificações</Text>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={
          notifications.length === 0 && styles.emptyContainer
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name="notifications-off-outline"
              size={48}
              color="#9CA3AF"
            />
            <Text style={styles.emptyTitle}>Sem notificações</Text>
            <Text style={styles.emptyText}>
              Quando algo importante acontecer, aparece aqui.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  card: {
    flexDirection: "row",
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  unreadCard: {
    backgroundColor: "#EFF6FF",
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
  },
  unreadTitle: {
    fontWeight: "700",
  },
  message: {
    fontSize: 13,
    color: "#4B5563",
    marginTop: 2,
  },
  date: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 6,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
  },
  emptyText: {
    marginTop: 6,
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
  },
});
