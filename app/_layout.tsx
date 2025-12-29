import { Slot, useRouter, useSegments } from "expo-router";
import { useContext, useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthContext, AuthProvider } from "../context/AuthContext";
import { ErrorProvider, useError } from "@/context/ErrorContext";
import { ErrorAlert } from "@/components/ErrorAlert";
// import {
//   useFonts as useRoboto,
//   Roboto_400Regular,
//   Roboto_700Bold,
// } from "@expo-google-fonts/roboto";
// import { Text } from "react-native";
// import {
//   useFonts as usePoppins,
//   Poppins_400Regular,
//   Poppins_700Bold,
// } from "@expo-google-fonts/poppins";

function RootNavigation() {
  const segments = useSegments();
  const router = useRouter();
  const { user, loading } = useContext(AuthContext);
  const { error, clearError } = useError();
  console.log({ error });
  useEffect(() => {
    if (loading) return;

    // Only redirect to login if not already on login or register
    const isAuthRoute = segments[0] === "(auth)";

    if (!user && !isAuthRoute) {
      console.log("Entra");
      router.replace("/(auth)/login");
    }
  }, [segments, user, loading, router]);

  return (
    <>
      {error ? <ErrorAlert message={error} onClose={clearError} /> : null}
      <Slot />
    </>
  );
}

export default function Layout() {
  // Choose one font family to use (uncomment the one you want)
  //const [fontsLoaded] = usePoppins({ Poppins_400Regular, Poppins_700Bold });
  // const [fontsLoaded] = useRoboto({ Roboto_400Regular, Roboto_700Bold });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <ErrorProvider>
            <RootNavigation />
          </ErrorProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
