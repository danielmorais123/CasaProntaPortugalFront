import { Item } from "@/components/AutocompleteInput";
import { api } from "./api";
import { PagedUsersResponse } from "@/types/models";
export async function getProfile() {
  const res = await api.get("/user/profile");
  return res.data;
}

export async function updateProfile(data: any) {
  return await api.put("/user/profile", data);
}

export const searchUsers = async (query: string): Promise<Item[]> => {
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
export async function getPagedUsers(params: {
  page?: number;
  pageSize?: number;
  query?: string;
  email?: string;
  name?: string;
  plan?: string;
  status?: string;
  createdFrom?: string;
  createdTo?: string;
}): Promise<PagedUsersResponse> {
  const res = await api.get("/user/paged", { params });
  return res.data;
}
