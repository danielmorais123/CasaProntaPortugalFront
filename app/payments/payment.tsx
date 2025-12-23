import React, { useEffect, useState, useContext } from "react";
import { Text } from "react-native";
import { WebView } from "react-native-webview";
import { api } from "@/hooks/services/api";
import { AuthContext } from "@/context/AuthContext";

export default function PaymentScreen() {
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    async function getSession() {
      if (!user?.email) return;
      const res = await api.post(
        "/payments/create-checkout-session",
        user.email,
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      setCheckoutUrl(res.data.url);
    }
    getSession();
  }, [user]);

  if (!checkoutUrl) return <Text>Loading...</Text>;

  return <WebView source={{ uri: checkoutUrl }} />;
}
