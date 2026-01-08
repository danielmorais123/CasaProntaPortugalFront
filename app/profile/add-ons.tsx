import React, { useState } from "react";
import { View, Text, Button } from "react-native";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/hooks/services/api";
import { AddonType, SubscriptionAddon } from "@/types/models";

const availableAddons = [
  { type: AddonType.ExtraDocuments, label: "Extra Documentos" },
  { type: AddonType.ExtraGuests, label: "Extra Convidados" },
  // ...add all types
];

export default function AddonsScreen() {
  const { data: subscription } = useQuery(["subscription"], () =>
    api.get("/subscriptions/current").then((res) => res.data)
  );
  const [addons, setAddons] = useState<SubscriptionAddon[]>(
    subscription?.addons || []
  );

  const mutation = useMutation((newAddons: any) =>
    api.post("/subscriptions/addons", { addons: newAddons })
  );

  const handleChange = (type: AddonType, quantity: number) => {
    setAddons((prev) =>
      prev.map((a) => (a.type === type ? { ...a, quantity } : a))
    );
  };

  return (
    <View>
      <Text>Gerir Add-ons</Text>
      {availableAddons.map((addon) => (
        <View key={addon.type}>
          <Text>{addon.label}</Text>
          {/* Add UI for quantity selection */}
          <Button
            title="+"
            onPress={() =>
              handleChange(
                addon.type,
                (addons.find((a) => a.type === addon.type)?.quantity || 0) + 1
              )
            }
          />
        </View>
      ))}
      <Button title="Guardar" onPress={() => mutation.mutate(addons)} />
    </View>
  );
}
