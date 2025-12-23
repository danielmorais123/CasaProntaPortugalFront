import React, { useEffect, useState } from "react";
import { Text } from "react-native";
import { WebView } from "react-native-webview";
import { api } from "@/hooks/services/api";

export default function PaymentScreen() {
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  useEffect(() => {
    async function getSession() {
      // Replace with the actual logged-in user's email
      const res = await api.post("/payments/create-checkout-session", {
        userEmail: "user@email.com",
      });
      setCheckoutUrl(res.data.url);
    }
    getSession();
  }, []);

  if (!checkoutUrl) return <Text>Loading...</Text>;

  return <WebView source={{ uri: checkoutUrl }} />;
}
