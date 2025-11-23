import { Link, useRouter } from "expo-router";
import { useContext, useState } from "react";
import { Button, Text, TextInput, View } from "react-native";
import { AuthContext } from "../../context/AuthContext";

export default function RegisterScreen() {
  const { register } = useContext(AuthContext);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    const ok = await register(email, password);
    if (ok) router.push("/(auth)/login");
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>Register</Text>

      <TextInput
        placeholder="Email"
        style={{ borderBottomWidth: 1, marginTop: 20 }}
        onChangeText={setEmail}
        value={email}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        style={{ borderBottomWidth: 1, marginTop: 20 }}
        onChangeText={setPassword}
        value={password}
      />

      <Button title="Register" onPress={handleRegister} />

      <Link href="/(auth)/login">
        <Text style={{ marginTop: 20, color: "blue" }}>Back to login</Text>
      </Link>
    </View>
  );
}
