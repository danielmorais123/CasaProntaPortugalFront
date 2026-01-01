import React from "react";
import { Text } from "react-native";
import { WebView } from "react-native-webview";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";

export default function BillingManageScreen() {
  const params = useLocalSearchParams();
  const url = params.billingPortalUrl as string | undefined;
  const router = useRouter();
  const queryClient = useQueryClient();

  if (!url) return <Text>URL não fornecido.</Text>;

  return (
    <WebView
      source={{ uri: url }}
      onNavigationStateChange={(navState) => {
        // Optionally, handle return/cancel navigation here
        if (navState.url.includes("/profile")) {
          queryClient.invalidateQueries({ queryKey: ["user"] });
          router.replace("/profile");
        }
        if (navState.url.includes("/payment")) {
          queryClient.invalidateQueries({ queryKey: ["user"] });
          router.replace("/payments/payment-error");
        }
      }}
    />
  );
}
