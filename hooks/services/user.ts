import { api } from "./api";
import { UserSearchResult } from "@/types/models";
export async function getProfile() {
  const res = await api.get("/user/profile");
  return res.data;
}

export async function updateProfile(data: any) {
  return await api.put("/user/profile", data);
}

export const searchUsers = async (
  query: string
): Promise<UserSearchResult[]> => {
  if (!query) return [];
  const res = await api.get("/user/search", {
    params: { query },
  });
  // The backend returns [{ Id, Email }]
  return res.data.map((u: any) => ({
    id: u.id,
    label: u.email,
  }));
};
