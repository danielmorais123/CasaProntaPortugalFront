import { api } from "./api";
import { PropertyType } from "@/types/models";

// Get all documents the user can access
export const getAllDocuments = async () => {
  const response = await api.get("/document");
  return response.data;
};

// Get a document by ID
export const getDocumentById = async (id: string) => {
  const response = await api.get(`/document/${id}`);
  return response.data;
};

// Create a new document
export const createDocument = async (document: any) => {
  const response = await api.post("/document", document);
  return response.data;
};

// Generate a pre-signed upload URL
export const generateUploadUrl = async (payload: any) => {
  const response = await api.post("/document/upload-url", payload);
  return response.data;
};

// Confirm upload
export const confirmUpload = async (id: string, payload: any) => {
  const response = await api.post(`/document/${id}/confirm-upload`, payload);
  return response.data;
};

// Generate a pre-signed download URL
export const generateDownloadUrl = async (id: string) => {
  const response = await api.get(`/document/${id}/download-url`);
  return response.data;
};

// Update a document
export const updateDocument = async (id: string, document: any) => {
  const response = await api.put(`/document/${id}`, document);
  return response.data;
};

// Delete a document
export const deleteDocument = async (id: string) => {
  const response = await api.delete(`/document/${id}`);
  return response.data;
};

// Get document suggestions by property type
export const getSuggestionsByPropertyType = async (type: PropertyType) => {
  const response = await api.get(
    `/document/suggestions/by-property-type/${type}`
  );
  return response.data;
};

// Get document suggestions by scope
export const getSuggestionsByScope = async (scope: string) => {
  const response = await api.get(`/document/suggestions/by-scope/${scope}`);
  return response.data;
};
// Get documents by propertyId
export const getDocumentsByPropertyId = async (propertyId: string) => {
  const response = await api.get(`/document/by-property/${propertyId}`);
  return response.data;
};
