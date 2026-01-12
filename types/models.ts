export enum DocumentType {
  CadernetaPredial = 1,
  CertidaoPermanenteRegistoPredial = 2,
  TituloAquisicaoOuEscritura = 3,
  LicencaUtilizacaoOuIsencao = 4,
  CertificadoEnergetico = 5,
  FichaTecnicaHabitacao = 6,
  PlantasImovelOuCamararias = 7,
  ProjetoConstrucaoELicencasObra = 8,
  ComprovativoPagamentoIMI = 9,
  ContratoArrendamento = 20,
  PlantaLocalizacao = 40,
  LevantamentoTopografico = 41,
  InformacaoPreviaOuPIP = 42,
  AlvaraLoteamento = 43,
  PareceresCamararios = 44,
  RegulamentoCondominio = 60,
  AtasCondominio = 61,
  SeguroEdificioPartesComuns = 62,
  RelatorioContasCondominio = 63,
  MapaQuotasERecibosCondominio = 64,
  ContratosManutencao = 65,
  InspecoesObrigatorias = 66,
  OrcamentosEObrasPartesComuns = 67,
  ContratoAdministracaoCondominio = 68,
  Other = 999,
}

export const DocumentTypeName: Record<DocumentType, string> = {
  [DocumentType.CadernetaPredial]: "Caderneta Predial",
  [DocumentType.CertidaoPermanenteRegistoPredial]:
    "Certidão Permanente Registo Predial",
  [DocumentType.TituloAquisicaoOuEscritura]: "Título de Aquisição / Escritura",
  [DocumentType.LicencaUtilizacaoOuIsencao]: "Licença de Utilização / Isenção",
  [DocumentType.CertificadoEnergetico]: "Certificado Energético",
  [DocumentType.FichaTecnicaHabitacao]: "Ficha Técnica de Habitação",
  [DocumentType.PlantasImovelOuCamararias]: "Plantas do Imóvel / Camarárias",
  [DocumentType.ProjetoConstrucaoELicencasObra]:
    "Projeto de Construção e Licenças de Obra",
  [DocumentType.ComprovativoPagamentoIMI]: "Comprovativo de Pagamento IMI",
  [DocumentType.ContratoArrendamento]: "Contrato de Arrendamento",
  [DocumentType.PlantaLocalizacao]: "Planta de Localização",
  [DocumentType.LevantamentoTopografico]: "Levantamento Topográfico",
  [DocumentType.InformacaoPreviaOuPIP]: "Informação Prévia / PIP",
  [DocumentType.AlvaraLoteamento]: "Alvará de Loteamento",
  [DocumentType.PareceresCamararios]: "Pareceres Camarários",
  [DocumentType.RegulamentoCondominio]: "Regulamento de Condomínio",
  [DocumentType.AtasCondominio]: "Atas de Condomínio",
  [DocumentType.SeguroEdificioPartesComuns]: "Seguro Edifício (Partes Comuns)",
  [DocumentType.RelatorioContasCondominio]: "Relatório de Contas de Condomínio",
  [DocumentType.MapaQuotasERecibosCondominio]:
    "Mapa de Quotas e Recibos de Condomínio",
  [DocumentType.ContratosManutencao]: "Contratos de Manutenção",
  [DocumentType.InspecoesObrigatorias]: "Inspeções Obrigatórias",
  [DocumentType.OrcamentosEObrasPartesComuns]:
    "Orçamentos e Obras (Partes Comuns)",
  [DocumentType.ContratoAdministracaoCondominio]:
    "Contrato de Administração de Condomínio",
  [DocumentType.Other]: "Outro Documento",
};

export enum PropertyType {
  House = 1,
  Apartment = 2,
  Land = 3,
  Building = 4,
  Unit = 5,
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

export enum PermissionLevel {
  Read = 0,
  Admin = 1,
  Temporary = 2,
}

export interface Document {
  id: string;
  type: DocumentType;
  category: DocumentCategory;
  propertyId: string;
  property?: Property;
  expirationDate?: string;
  issueDate?: string;
  issuedBy?: string;
  referenceNumber?: string;
  fileUrl: string;
  originalFileName?: string;
  mimeType?: string;
  fileSizeBytes?: number;
  fileHash?: string;
  uploadedByUserId?: string;
  uploadedBy?: User;
  parentDocumentId?: string;
  parentDocument?: Document;
  processingStatus?: number | string;
  extractedFields?: Record<string, string>;
  extractionConfidence?: number;
  extractionError?: string;
  createdAt?: string;
  updatedAt?: string;
  alerts?: Alert[];
}

export interface PropertyPermission {
  id: string;
  userId: string;
  user?: User;
  propertyId: string;
  property?: Property;
  permissionLevel: PermissionLevel;
  expiresAt?: string;
  createdAt?: string;
}

export interface Property {
  id: string;
  name: string;
  streetName: string;
  ownerId: string;
  type: PropertyType;
  owner?: User;
  documents: Document[];
  permissions: PropertyPermission[];
  alerts: Alert[];
  parentPropertyId?: string;
  parentProperty?: Property;
  units?: Property[];
  createdAt?: string;
}

export enum UserRole {
  User = 0, // utilizador normal
  Admin = 1, // admin interno (suporte, backoffice)
  SuperAdmin = 2, // só tu / equipa core
}

export interface User {
  id: string;
  name: string;
  email: string;
  stripeCustomerId?: string;
  createdAt?: string;
  subscription?: Subscription;
  permissions?: PropertyPermission[];
  properties?: Property[];
  payments?: Payment[];
  alerts?: Alert[];
  planName?: string;
  planCode?: string;
  plan?: SubscriptionPlanDto;
  isPremium?: boolean;
  maxProperties?: number;
  maxDocumentsPerProperty?: number;
  role?: UserRole; // <-- add this line
}

export enum AlertType {
  DocumentExpired,
  DocumentExpiringSoon,
  MissingRequiredDocument,
  DocumentUnreadable,
  AiReviewRequired,
  AiLowConfidence,
  DataConflictDetected,
  PaymentDue,
  PaymentFailed,
  SubscriptionRenewal,
  SubscriptionLimitReached,
  InspectionDue,
  WarrantyExpiring,
  InsuranceExpired,
  SecurityAlert,
  SharedAccessExpiring,
  ManualReminder,
  Other,
}

export enum AlertSource {
  System,
  AI,
  User,
}

export enum AlertSeverity {
  Critical,
  Important,
  Info,
  Success,
}

export enum AlertStatus {
  Pending,
  Active,
  Snoozed,
  Resolved,
  Dismissed,
}

export interface Alert {
  id: string;
  userId: string;
  user: User;
  propertyId?: string;
  property?: Property;
  documentId?: string;
  document?: Document;
  type: AlertType;
  source: AlertSource;
  severity: AlertSeverity;
  title: string;
  message: string;
  triggerDate: string;
  triggeredAt?: string;
  expiresAt?: string;
  snoozedUntil?: string;
  requiresAction: boolean;
  status: AlertStatus;
  relatedEntityId?: string;
  relatedEntityType?: string;
  createdAt: string;
  dismissedAt?: string;
}

export enum PaymentStatus {
  Pending,
  Paid,
  Failed,
  Canceled,
  Refunded,
  Unpaid,
}

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus; // <-- use the enum here
  stripePaymentId: string;
  subscriptionId: string;
  userId: string;
  createdAt: string;
  paidAt?: string;
}

export enum SubscriptionPlan {
  Free,
  Starter,
  Pro,
  Business,
  Portfolio,
  Enterprise,
}

export enum SubscriptionStatus {
  Active,
  Canceled,
  PastDue,
}

export interface Subscription {
  id: string;
  userId: string;
  user?: User;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  stripeSubscriptionId?: string;
  startedAt: string;
  endsAt?: string;
  createdAt: string;
  addons: SubscriptionAddon[];
  aiAnalyses?: any[];
}
export enum AddonType {
  ExtraBuildings,
  ExtraAiDocs,
  ExtraDocuments,
  ExtraGuests,
}
export interface SubscriptionAddon {
  id: string;
  type: AddonType;
  quantity: number;
  subscriptionId: string;
}

export type PlanLimits = {
  maxProperties?: number;
  maxDocuments?: number;
  maxGuests?: number;
  maxBuildings?: number;
  maxUnitsPerBuilding?: number;
  aiOnUpload?: boolean;
  maxUploadMb?: number;
  canEncrypt?: boolean;
};

export type SubscriptionPlanDto = {
  code: string;
  name: string;
  priceMonthly?: number;
  priceYearly?: number;
  isPopular: boolean;
  description?: string;
  limits?: PlanLimits;
  features: string[];
  excludedFeatures?: string[];
};

export type UserSearchResult = {
  id: string;
  email: string;
};
export type PagedUsersResponse = {
  items: User[];
  total: number;
  page: number;
  pageSize: number;
};
export type PagedPropertiesResponse = {
  items: Property[];
  page: number;
  pageSize: number;
  total: number;
};
export enum NotificationChannel {
  InApp = 0,
  Email = 1,
  Push = 2,
}

export enum NotificationStatus {
  Pending = 0,
  Sent = 1,
  Failed = 2,
  Read = 3,
}

export interface Notification {
  id: string;
  userId: string;
  user?: User;
  alertId?: string;
  alert?: Alert;
  channel: NotificationChannel;
  title: string;
  message: string;
  status: NotificationStatus;
  providerMessageId?: string;
  error?: string;
  createdAt: string;
  sentAt?: string;
  readAt?: string;
}
