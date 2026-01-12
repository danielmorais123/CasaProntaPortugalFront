import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/services/api";
import { LoadErrorScreen } from "@/components/StateScreens";
import { getNotifications } from "@/hooks/services/notification";
import { Notification } from "@/types/models";

export default function NotificationsScreen() {
  const queryClient = useQueryClient();

  const {
    data: notifications = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => await getNotifications(),
    staleTime: 1000 * 60 * 2,
  });

  const markAsRead = async (id: string) => {
    await api.post(`/notifications/${id}/read`);
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  // Use alert?.type if available, otherwise fallback
  const renderIcon = (
    notification: Notification
  ): React.ComponentProps<typeof Ionicons>["name"] => {
    // const type = notification.alert?.type;

    return "warning-outline";
  };

  const renderItem = ({ item }: { item: Notification }) => {
    const isRead = !!item.readAt;
    return (
      <Pressable
        onPress={() => markAsRead(item.id)}
        style={[styles.card, !isRead && styles.unreadCard]}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name={renderIcon(item)}
            size={22}
            color={isRead ? "#6B7280" : "#2563EB"}
          />
        </View>
        <View style={styles.content}>
          <Text style={[styles.title, !isRead && styles.unreadTitle]}>
            {item.title}
          </Text>
          <Text style={styles.message}>{item.message}</Text>
          <Text style={styles.date}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </Pressable>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator />
          <Text style={{ marginTop: 16, color: "#666", fontWeight: "800" }}>
            A carregar notificações…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadErrorScreen
          onRetry={() => console.log("Retrying...")}
          title="Erro ao carregar dados"
          subtitle={
            "Não conseguimos obter os imóveis/alertas. Tenta novamente."
          }
        />
      </SafeAreaView>
    );
  }

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
          <RefreshControl refreshing={isFetching} onRefresh={refetch} />
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
