import { GestureHandlerRootView } from "react-native-gesture-handler";
// import * as Notifications from "expo-notifications";
import { registerForPushNotifications } from "@/hooks/services/pushNotifications";

import { useEffect, useContext } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { AuthContext, AuthProvider } from "../context/AuthContext";
import { ErrorProvider, useError } from "@/context/ErrorContext";
import { ErrorAlert } from "@/components/ErrorAlert";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BottomIslandNav } from "@/components/IslandDock";

const queryClient = new QueryClient();

function RootNavigation() {
  const segments = useSegments();
  const router = useRouter();
  const { user, loading } = useContext(AuthContext);
  const { error, clearError } = useError();
  useEffect(() => {
    if (!loading) {
      const isAuthRoute = segments[0] === "(auth)";
      if (!user && !isAuthRoute) {
        router.replace("/(auth)/login");
      } else if (user && isAuthRoute) {
        router.replace("/");
      }
    }
  }, [segments, user, loading, router]);

  useEffect(() => {
    if (user) {
      registerForPushNotifications();
    }
  }, [user]);
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
              <BottomIslandNav />
            </ErrorProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
