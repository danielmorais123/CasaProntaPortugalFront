import { Link } from "expo-router";
import { useContext, useEffect, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { AuthContext } from "../../context/AuthContext";

export default function LoginScreen() {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Por favor, preencha todos os campos.");
      return;
    }
    const ok = await login(email, password);
    if (!ok) setError("Email ou password incorretos.");
  };
  useEffect(() => {
    if (email && password) setError("");
  }, [email, password]);
  return (
    <View className="flex-1 justify-center px-6 bg-gray-100">
      <Text className="text-3xl font-bold mb-1 text-center">Bem-vindo 👋</Text>
      <Text className="text-base text-gray-600 mb-8 text-center">
        Entre na sua conta
      </Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#999"
        className={`bg-white p-4 rounded-xl border mb-4 text-base shadow-sm ${
          !email && error ? "border-red-500 border-2" : "border-gray-300"
        }`}
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#999"
        secureTextEntry
        className={`bg-white p-4 rounded-xl border mb-2 text-base shadow-sm ${
          !password && error ? "border-red-500 border-2" : "border-gray-300"
        }`}
        value={password}
        onChangeText={setPassword}
      />

      {error ? (
        <Text className="text-red-600 text-center mb-2">{error}</Text>
      ) : null}

      <TouchableOpacity
        onPress={handleLogin}
        className="bg-blue-600 py-4 rounded-xl mt-3 shadow-sm"
      >
        <Text className="text-center text-white font-semibold text-lg">
          Entrar
        </Text>
      </TouchableOpacity>

      <Link href="/(auth)/register" asChild>
        <TouchableOpacity className="mt-6">
          <Text className="text-center text-gray-700 text-base">
            Não tem conta?{" "}
            <Text className="font-bold text-blue-600">Registe-se</Text>
          </Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}
