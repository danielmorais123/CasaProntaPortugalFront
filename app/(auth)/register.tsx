import { Link, useRouter } from "expo-router";
import { useContext, useEffect, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { AuthContext } from "../../context/AuthContext";

export default function RegisterScreen() {
  const { register } = useContext(AuthContext);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async () => {
    if (!email || !password) {
      setError("Por favor, preencha todos os campos.");
      return;
    }
    const ok = await register(email, password);
    if (ok) router.push("/(auth)/login");
    else setError("Email já registado.");
  };
  useEffect(() => {
    if (email && password) setError("");
  }, [email, password]);
  return (
    <View className="flex-1 justify-center px-6 bg-gray-100">
      <Text className="text-3xl font-bold mb-1 text-center">
        Criar Conta ✨
      </Text>
      <Text className="text-base text-gray-600 mb-8 text-center">
        Registe-se para começar
      </Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#999"
        className="bg-white p-4 rounded-xl border border-gray-300 mb-4 text-base shadow-sm"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#999"
        secureTextEntry
        className="bg-white p-4 rounded-xl border border-gray-300 mb-2 text-base shadow-sm"
        value={password}
        onChangeText={setPassword}
      />

      {error ? (
        <Text className="text-red-600 text-center mb-2">{error}</Text>
      ) : null}

      <TouchableOpacity
        onPress={handleRegister}
        className="bg-green-600 py-4 rounded-xl mt-3 shadow-sm"
      >
        <Text className="text-center text-white font-semibold text-lg">
          Registar
        </Text>
      </TouchableOpacity>

      <Link href="/(auth)/login" asChild>
        <TouchableOpacity className="mt-6">
          <Text className="text-center text-gray-700 text-base">
            Já tem conta?{" "}
            <Text className="font-bold text-green-600">Entrar</Text>
          </Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}
