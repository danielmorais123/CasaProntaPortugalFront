import React, { useState } from "react";
import { View, Text } from "react-native";
import { api } from "@/hooks/services/api";
import { AutocompleteInput } from "./AutocompleteInput";
import { SelectInput } from "./SelectInput";
import { DateInput } from "./DateInput";
import { searchUsers as searchUsersFn } from "@/hooks/services/user";
import { Button } from "@/components/Button";
export function ShareProperty({ propertyId }: { propertyId: string }) {
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [permissionLevel, setPermissionLevel] = useState("2");
  const [expiresAt, setExpiresAt] = useState("");
  const [, setMessage] = useState("");

  // Função para pesquisar utilizadores por email
  const searchUsers = async (query: string) => {
    if (!query) return [];
    return await searchUsersFn(query);
  };

  const handleShare = async () => {
    if (!selectedUser) {
      setMessage("Selecione um utilizador.");
      return;
    }
    try {
      await api.post(`/properties/${propertyId}/permissions/share`, {
        userId: selectedUser.id,
        permissionLevel: Number(permissionLevel),
        expiresAt,
      });
      setMessage("Partilha efetuada com sucesso!");
    } catch {
      setMessage("Erro ao partilhar imóvel.");
    }
  };

  return (
    <View>
      <Text>Email do utilizador:</Text>
      <AutocompleteInput
        placeholder="Pesquisar utilizador por email"
        searchFn={searchUsers}
        onSelect={setSelectedUser}
      />
      <Text>Nível de permissão:</Text>
      <SelectInput
        options={[
          { label: "Leitura", value: "1" },
          { label: "Gestão", value: "2" },
        ]}
        value={permissionLevel}
        onChange={setPermissionLevel}
      />
      <Text>Validade (opcional):</Text>
      <DateInput
        value={expiresAt}
        onChange={setExpiresAt}
        placeholder="YYYY-MM-DD"
      />
      <Button
        variant="default"
        title="Partilhar imóvel"
        onPress={handleShare}
      />
    </View>
  );
}
