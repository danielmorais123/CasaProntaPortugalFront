import { api } from "./api";
import { Property } from "@/types/models";
export const getAllProperties = async () => {
  const response = await api.get<Property[]>("/property", {
    withCredentials: true,
  });
  return response.data;
};

export const getPropertyById = async (id: string) => {
  const response = await api.get<Property>(`/property/${id}`);
  return response.data;
};

export const createProperty = async (property: Property) => {
  const response = await api.post<Property>("/property", property);
  return response.data;
};

export const updateProperty = async (id: string, property: any) => {
  const response = await api.put<any>(`/property/${id}`, property);
  return response.data;
};

export const deleteProperty = async (id: string) => {
  const response = await api.delete(`/property/${id}`);
  return response.data;
};
