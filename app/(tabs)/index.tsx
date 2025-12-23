// HomeScreen.js
import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/hooks/services/api";
import { Property, Alert } from "@/types/models";
import { useRouter } from "expo-router";
import { Alert as AlertComponent } from "@/components/Alert";
import { AuthContext } from "@/context/AuthContext";
// Badge Color based on urgency

type SectionType = "header" | "banner" | "properties" | "alerts";

type Section = {
  type: SectionType;
};
const HomeScreen = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { logout } = useContext(AuthContext);
  const router = useRouter();
  const fetchData = async () => {
    setLoading(true);
    try {
      const [propertiesRes, alertsRes] = await Promise.all([
        api.get("/property"),
        api.get("/alerts/upcoming?days=30"),
      ]);

      setProperties(propertiesRes.data);
      setAlerts(alertsRes.data);
    } catch (e) {
      // Handle error (show toast, etc)
      setProperties([]);
      setAlerts([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const data: Section[] = [
    { type: "header" },
    { type: "alerts" },
    { type: "banner" },
    { type: "properties" },
  ];

  const renderItem = ({ item }: { item: Section }) => {
    switch (item.type) {
      case "header":
        return (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              padding: 20,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 22, fontWeight: "bold" }}>CasaPronta</Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="notifications-outline"
                size={24}
                style={{ marginRight: 15 }}
              />
              <Ionicons name="person-circle-outline" size={28} />
              <TouchableOpacity
                style={{
                  marginLeft: 15,
                  backgroundColor: "#2563EB",
                  paddingVertical: 6,
                  paddingHorizontal: 14,
                  borderRadius: 8,
                }}
                onPress={logout}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>
                  Logout
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      case "banner":
        return (
          <View
            style={{
              backgroundColor: "#4A90E2",
              marginBottom: 10,
              padding: 20,
              borderRadius: 15,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "600" }}>
              Bem-vindo!
            </Text>
            <Text style={{ color: "#fff", marginTop: 5 }}>
              Você tem {properties.length} imóveis cadastrados e {alerts.length}{" "}
              documentos próximos do vencimento
            </Text>
            <TouchableOpacity
              style={{
                marginTop: 10,
                backgroundColor: "#fff",
                padding: 10,
                borderRadius: 10,
                alignSelf: "flex-start",
              }}
              onPress={() => router.push("/property/add-property")}
            >
              <Text style={{ color: "#4A90E2", fontWeight: "bold" }}>
                Adicionar Imóvel
              </Text>
            </TouchableOpacity>
          </View>
        );
      case "properties":
        return (
          <>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                marginBottom: 10,
              }}
            >
              Seus Imóveis
            </Text>
            <FlatList
              horizontal
              data={properties}
              keyExtractor={(item) =>
                item.id?.toString() ?? item.id?.toString()
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{
                    backgroundColor: "#fff",
                    marginRight: 15,
                    borderRadius: 15,
                    width: 200,
                    shadowColor: "#000",
                    shadowOpacity: 0.1,
                    shadowRadius: 5,
                    elevation: 3,
                  }}
                  onPress={() => router.push(`/property/${item.id}`)}
                >
                  <Image
                    source={{
                      uri: "https://i.pinimg.com/736x/0a/bd/e3/0abde3a78895986150ee846d56b6da52.jpg",
                    }}
                    style={{
                      width: "100%",
                      height: 120,
                      borderTopLeftRadius: 15,
                      borderTopRightRadius: 15,
                    }}
                  />
                  <View style={{ padding: 10 }}>
                    <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                      {item.name}
                    </Text>
                    {/* <Text style={{ color: "gray", fontSize: 14 }}>
                      {item.address}
                    </Text> */}
                    {item.alerts && item.alerts.length > 0 && (
                      <View
                        style={{
                          marginTop: 5,
                          backgroundColor: "red",
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 10,
                          alignSelf: "flex-start",
                        }}
                      >
                        <Text style={{ color: "#fff", fontSize: 12 }}>
                          {item.alerts.length} Alertas
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              )}
            />
          </>
        );
      case "alerts":
        return (
          <View>
            <View
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexDirection: "row",
                marginBottom: 10,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  marginBottom: 10,
                }}
              >
                Alertas
              </Text>
              {alerts.length > 3 && (
                <TouchableOpacity
                  style={{
                    alignSelf: "center",
                    marginTop: 8,
                    padding: 8,
                    borderRadius: 8,
                    backgroundColor: "#2563EB",
                  }}
                  onPress={() => router.push("/alerts")}
                >
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>
                    Ver todos os alertas
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            {alerts.length === 0 ? (
              <View>
                <AlertComponent
                  alert={{
                    id: "no-alerts",
                    title: "Sem alertas",
                    message: "Não há alertas próximos.",
                    urgency: "low",
                  }}
                />
              </View>
            ) : (
              <FlatList
                data={alerts.slice(0, 3)}
                keyExtractor={(item) =>
                  item.id?.toString() ?? item.id?.toString()
                }
                contentContainerStyle={{
                  paddingHorizontal: 20,
                  paddingBottom: 10,
                }}
                renderItem={({ item }) => <AlertComponent alert={item} />}
              />
            )}
          </View>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "#F5F6FA" }}
        edges={["top", "left", "right"]}
      >
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#4A90E2" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#F5F6FA",
        marginLeft: 20,
        marginRight: 20,
      }}
      edges={["top", "left", "right"]}
    >
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.type}
        style={{ flex: 1, backgroundColor: "#F5F6FA" }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
};

export default HomeScreen;
