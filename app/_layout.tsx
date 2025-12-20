import { Slot, useRouter, useSegments } from "expo-router";
import { useContext, useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthContext, AuthProvider } from "../context/AuthContext";

function RootNavigation() {
  const segments = useSegments();
  const router = useRouter();
  const { user, loading } = useContext(AuthContext);

  useEffect(() => {
    if (loading) return;

    // Only redirect to login if not already on login or register
    const isAuthRoute =
      segments[0] === "(auth)" &&
      (segments[1] === "login" || segments[1] === "register");
    console.log({ user, isAuthRoute });
    if (!user && !isAuthRoute) {
      router.replace("/(auth)/login");
    }
  }, [segments, user, loading, router]);

  return <Slot />;
}

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <RootNavigation />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
