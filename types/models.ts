export enum DocumentType {
  CadernetaPredial = "CadernetaPredial",
  CertidaoPermanenteRegistoPredial = "CertidaoPermanenteRegistoPredial",
  LicencaUtilizacaoOuIsencao = "LicencaUtilizacaoOuIsencao",
  CertificadoEnergetico = "CertificadoEnergetico",
  FichaTecnicaHabitacao = "FichaTecnicaHabitacao",
  PlantasImovelOuCamararias = "PlantasImovelOuCamararias",
  ProjetoConstrucaoELicencasObra = "ProjetoConstrucaoELicencasObra",
  ComprovativoPagamentoIMI = "ComprovativoPagamentoIMI",
  TituloAquisicaoOuEscritura = "TituloAquisicaoOuEscritura",
  DocumentosCondominio = "DocumentosCondominio",
  Other = "Other",
}

export enum DocumentCategory {
  Legal = "Legal",
  Fiscal = "Fiscal",
  Technical = "Technical",
  Insurance = "Insurance",
  Rental = "Rental",
  Media = "Media",
  Other = "Other",
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
