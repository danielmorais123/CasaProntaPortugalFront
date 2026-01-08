import { api } from "./api";
import { PropertyType, Document, DocumentType } from "@/types/models";

// Get all documents the user can access
export const getAllDocuments = async (): Promise<Document[]> => {
  const response = await api.get<Document[]>("/document");
  return response.data;
};

// Get a document by ID
export const getDocumentById = async (id: string): Promise<Document> => {
  const response = await api.get<Document>(`/document/${id}`);
  return response.data;
};

// Create a new document
export const createDocument = async (document: any): Promise<Document> => {
  const response = await api.post<Document>("/document", document);
  return response.data;
};

// Generate a pre-signed upload URL
export const generateUploadUrl = async (
  payload: any
): Promise<{ url: string }> => {
  const response = await api.post<{ url: string }>(
    "/document/upload-url",
    payload
  );
  return response.data;
};

// Confirm upload
export const confirmUpload = async (
  id: string,
  payload: any
): Promise<{ message: string; document: Document }> => {
  const response = await api.post<{ message: string; document: Document }>(
    `/document/${id}/confirm-upload`,
    payload
  );
  return response.data;
};

// Generate a pre-signed download URL
export const generateDownloadUrl = async (
  id: string
): Promise<{ downloadUrl: string }> => {
  const response = await api.get<{ downloadUrl: string }>(
    `/document/${id}/download-url`
  );
  return response.data;
};

// Update a document
export const updateDocument = async (
  id: string,
  document: any
): Promise<void> => {
  await api.put(`/document/${id}`, document);
};

// Delete a document
export const deleteDocument = async (id: string): Promise<void> => {
  await api.delete(`/document/${id}`);
};

// Get document suggestions by property type
export const getSuggestionsByPropertyType = async (
  type: PropertyType
): Promise<DocumentType[]> => {
  const response = await api.get<number[]>(
    `/document/suggestions/by-property-type/${type}`
  );
  return response.data;
};

// Get document suggestions by scope
export const getSuggestionsByScope = async (
  scope: string
): Promise<DocumentType[]> => {
  const response = await api.get<number[]>(
    `/document/suggestions/by-scope/${scope}`
  );
  return response.data;
};

// Get documents by propertyId
export const getDocumentsByPropertyId = async (
  propertyId: string
): Promise<Document[]> => {
  const response = await api.get<Document[]>(
    `/document/by-property/${propertyId}`
  );
  return response.data;
};
