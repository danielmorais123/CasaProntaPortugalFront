import React, { useEffect, useState, useContext } from "react";
import { Text } from "react-native";
import { WebView } from "react-native-webview";
import { api } from "@/hooks/services/api";
import { AuthContext } from "@/context/AuthContext";
import { useLocalSearchParams } from "expo-router";

export default function PaymentScreen() {
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const { user } = useContext(AuthContext);
  const params = useLocalSearchParams();
  const planCode = params.planCode || "pro"; // get planCode from route params

  useEffect(() => {
    async function getSession() {
      if (!user?.email || !planCode) return;
      const res = await api.post(
        "/payments/create-checkout-session",
        {
          userEmail: user.email,
          planCode: planCode,
          // add other params here if needed
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      setCheckoutUrl(res.data.url);
    }
    getSession();
  }, [user, planCode]);

  if (!checkoutUrl) return <Text>Loading...</Text>;

  return <WebView source={{ uri: checkoutUrl }} />;
}
