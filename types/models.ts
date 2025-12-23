export enum DocumentType {
  CadernetaPredial = 0,
  CertidaoPermanenteRegistoPredial = 1,
  LicencaUtilizacaoOuIsencao = 2,
  CertificadoEnergetico = 3,
  FichaTecnicaHabitacao = 4,
  PlantasImovelOuCamararias = 5,
  ProjetoConstrucaoELicencasObra = 6,
  ComprovativoPagamentoIMI = 7,
  TituloAquisicaoOuEscritura = 8,
  DocumentosCondominio = 9,
  Other = 10,
}

// DocumentCategory: keep the order and start at 0
export enum DocumentCategory {
  Legal = 0,
  Fiscal = 1,
  Technical = 2,
  Insurance = 3,
  Rental = 4,
  Media = 5,
  Other = 6,
}

export enum MediaFileType {
  Photo = "Photo",
  Video = "Video",
}

export enum PermissionLevel {
  Read = "Read",
  Admin = "Admin",
  Temporary = "Temporary",
}

export interface MediaFile {
  id: string;
  url: string;
  type: MediaFileType;
  inventoryItemId: string;
  inventoryItem?: InventoryItem;
}

export interface InventoryItem {
  id: string;
  propertyId: string;
  property?: Property;
  name: string;
  description: string;
  mediaFiles: MediaFile[];
  checklist: string[];
}

export interface Document {
  id: string;
  type: DocumentType;
  expirationDate?: string;
  fileUrl: string;
  category: DocumentCategory;
  propertyId: string;
  property?: Property;
}

export interface PropertyPermission {
  id: number;
  userId: string;
  user?: User;
  propertyId: string;
  property?: Property;
  permissionLevel: PermissionLevel;
  expiresAt?: string;
}

export interface Property {
  id: string;
  name: string;
  streetName: string;
  ownerId: string;
  owner?: User;
  documents: Document[];
  permissions: PropertyPermission[];
  alerts: Alert[];
  inventory: InventoryItem[];
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Alert {
  id: string;
  type: string;
  date: string;
  documentId?: string;
  document?: Document;
  propertyId: string;
  property?: Property;
  message: string;
}

export type UserSearchResult = {
  id: string;
  email: string;
};
