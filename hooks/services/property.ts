import { api, API_URL } from "./api";
import { Property, PagedPropertiesResponse } from "@/types/models";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
// Get all properties (paged, accessible to the user)
export const getAllProperties = async (page = 1, pageSize = 10) => {
  const response = await api.get("/property", {
    params: { page, pageSize },
  });
  return response.data as Promise<{
    items: Property[];
    page: number;
    pageSize: number;
    total: number;
  }>;
};

// Get a property by ID
export const getPropertyById = async (id: string) => {
  const response = await api.get(`/property/${id}`);
  return response.data as Promise<Property>;
};

// Create a new property
export const createProperty = async (property: Partial<Property>) => {
  const response = await api.post("/property", property);
  return response.data;
};

// Update a property
export const updateProperty = async (
  id: string,
  property: Partial<Property>
) => {
  const response = await api.put(`/property/${id}`, property);
  return response.data;
};

// Delete a property
export const deleteProperty = async (id: string) => {
  const response = await api.delete(`/property/${id}`);
  return response.data;
};
export const getPagedProperties = async (params: {
  page?: number;
  pageSize?: number;
  query?: string;
}): Promise<PagedPropertiesResponse> => {
  const response = await api.get("/property/paged", { params });
  return response.data;
};
// Download all documents for a property as a ZIP

// export async function downloadAllDocumentsExpo(
//   propertyId: string,
//   safeName: string
// ): Promise<string> {
//   const url = `${API_URL}/properties/${propertyId}/download-all-documents`;

//   const fileUri =
//     FileSystem.cacheDirectory + `${safeName}-documentos.zip`;

//   const downloadResumable = FileSystem.createDownloadResumable(
//     url,
//     fileUri,
//     {
//       // Cookies are sent automatically
//       headers: {},
//     }
//   );

//   const result = await downloadResumable.downloadAsync();

//   if (!result || result.status !== 200) {
//     throw new Error("Download failed");
//   }

//   if (await Sharing.isAvailableAsync()) {
//     await Sharing.shareAsync(result.uri, {
//       mimeType: "application/zip",
//       dialogTitle: "Descarregar documentos",
//     });
//   }

//   return result.uri;
// }
