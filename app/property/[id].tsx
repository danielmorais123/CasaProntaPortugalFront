import { useLocalSearchParams } from "expo-router";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { api } from "@/hooks/services/api";
import { Property } from "@/types/models";

import { ShareProperty } from "@/components/ShareProperty";
import { Button } from "@/components/Button";
import BottomSheetComponent from "@/components/BottomSheetComponent";
import BottomSheet from "@gorhom/bottom-sheet";

export default function PropertyDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const useRefBottomSheet = useRef<BottomSheet>(null);

  const handleOpen = () => {
    useRefBottomSheet.current?.expand();
  };
  useEffect(() => {
    api.get(`/property/${id}`).then((res) => setProperty(res.data));
  }, [id]);
  console.log({ property });
  if (!property) return <Text>Loading...</Text>;

  // Dummy counts for demo, replace with real data
  const alertsCount = property.alerts?.length ?? 0;
  const documentsCount = property.documents?.length ?? 0;
  const documentsTotal = 10; // Replace with real total
  const sharesCount =
    property.permissions?.filter(
      (p) => p.permissionLevel === "Admin" || p.permissionLevel === "Read"
    )?.length ?? 0;
  const inventoryCount = property.inventory?.length ?? 0;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#F5F6FA" }}
      edges={["top", "left", "right"]}
    >
      <View style={{ flex: 1, padding: 20 }}>
        <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 18 }}>
          {property.name}
        </Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <QuickStatusCard
            icon="time-outline"
            label="Alertas"
            value={`${alertsCount} próximos`}
          />
          <QuickStatusCard
            icon="document-outline"
            label="Documentos"
            value={`${documentsCount} / ${documentsTotal} completos`}
          />
          <QuickStatusCard
            icon="lock-closed-outline"
            label="Partilhas"
            value={`${sharesCount} ativa`}
          />
          <QuickStatusCard
            icon="cube-outline"
            label="Inventário"
            value={`${inventoryCount} itens`}
          />
        </View>
        <Button title="Partilhar imóvel" onPress={handleOpen} />
        <BottomSheetComponent ref={useRefBottomSheet}>
          <ShareProperty propertyId={id} />
        </BottomSheetComponent>
      </View>
    </SafeAreaView>
  );
}

function QuickStatusCard({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 14,
        alignItems: "center",
        width: 100,
        marginRight: 8,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      <Ionicons name={icon} size={28} color="#2563EB" />
      <Text style={{ fontWeight: "bold", fontSize: 15, marginTop: 6 }}>
        {label}
      </Text>
      <Text style={{ color: "#64748B", fontSize: 13, marginTop: 2 }}>
        {value}
      </Text>
    </View>
  );
}
