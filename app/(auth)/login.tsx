import { Link } from "expo-router";
import { useContext, useState } from "react";
import { Button, Text, TextInput, View } from "react-native";
import { AuthContext } from "../../context/AuthContext";

export default function LoginScreen() {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    const ok = await login(email, password);
    if (!ok) setError("Invalid email or password");
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>Login</Text>

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

      {error ? (
        <Text style={{ color: "red", marginTop: 10 }}>{error}</Text>
      ) : null}

      <Button title="Login" onPress={handleLogin} />

      <Link href="/(auth)/register">
        <Text style={{ marginTop: 20, color: "blue" }}>Create account</Text>
      </Link>
    </View>
  );
}
