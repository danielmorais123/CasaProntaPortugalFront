import { GestureHandlerRootView } from "react-native-gesture-handler";
// import * as Notifications from "expo-notifications";
// import { registerForPushNotifications } from "@/hooks/services/pushNotifications";

import { useState, useEffect, useContext } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { AuthContext, AuthProvider } from "../context/AuthContext";
import { ErrorProvider, useError } from "@/context/ErrorContext";
import { ErrorAlert } from "@/components/ErrorAlert";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";

const queryClient = new QueryClient();

function RootNavigation() {
  const segments = useSegments();
  const router = useRouter();
  const { user, loading } = useContext(AuthContext);
  const { error, clearError } = useError();
  const [layoutReady, setLayoutReady] = useState(false);

  useEffect(() => {
    setLayoutReady(true);
  }, []);

  useEffect(() => {
    if (!loading && layoutReady) {
      const isAuthRoute = segments[0] === "(auth)";
      if (!user && !isAuthRoute) {
        router.replace("/(auth)/login");
      } else if (user && isAuthRoute) {
        router.replace("/");
      }
    }
  }, [segments, user, loading, layoutReady, router]);
  console.log(user);
  // useEffect(() => {
  //   const responseListener =
  //     Notifications.addNotificationResponseReceivedListener((response) => {
  //       const alertId = response.notification.request.content.data?.alertId;

  //       if (alertId) {
  //         router.push(`/alerts/${alertId}`);
  //       }
  //     });

  //   return () => responseListener.remove();
  // }, [router]);

  // useEffect(() => {
  //   if (user) {
  //     registerForPushNotifications();
  //   }
  // }, [user]);
  return (
    <>
      {error ? <ErrorAlert message={error} onClose={clearError} /> : null}
      <Slot />
    </>
  );
}

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ErrorProvider>
              <RootNavigation />
            </ErrorProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
