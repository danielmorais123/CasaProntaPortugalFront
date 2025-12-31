import React, { useEffect, useState, useContext, useRef } from "react";
import { Text } from "react-native";
import { WebView } from "react-native-webview";
import { api } from "@/hooks/services/api";
import { AuthContext } from "@/context/AuthContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";

export default function PaymentScreen() {
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const { user } = useContext(AuthContext);
  const params = useLocalSearchParams();
  const planCode = params.planCode || "pro";
  const router = useRouter();
  const handled = useRef(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    async function getSession() {
      if (!user?.email || !planCode) return;
      console.log("Creating checkout session for plan:", planCode);
      const res = await api.post(
        "/payments/create-checkout-session",
        {
          userEmail: user.email,
          planCode: planCode,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      setCheckoutUrl(res.data.url);
    }
    getSession();
  }, [user, planCode]);

  // Detect Stripe redirect
  const handleNavigationStateChange = (navState: any) => {
    if (handled.current) return;
    if (
      navState.url.startsWith("http://192.168.8.100:8081/property") // success URL
    ) {
      handled.current = true;
      queryClient.invalidateQueries({ queryKey: ["user"] }); // <-- invalidate user cache
      router.replace("/profile");
    }
    if (
      navState.url.startsWith("http://192.168.8.100:8081/") // cancel URL
    ) {
      handled.current = true;
      router.back();
    }
  };

  if (!checkoutUrl) return <Text>Loading...</Text>;

  return (
    <WebView
      source={{ uri: checkoutUrl }}
      onNavigationStateChange={handleNavigationStateChange}
    />
  );
}
