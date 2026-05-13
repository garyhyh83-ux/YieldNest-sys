export type EntityType = "LLC" | "Corp" | "Partnership" | "Foundation" | "DAO";

export type KYBStatus =
  | "pending"
  | "in_review"
  | "approved"
  | "rejected"
  | "expired";

export interface UBO {
  fullName: string;
  ownershipPercentage: number;
  country: string;
  idDocumentType: string;
  idDocumentNumber: string;
}

export interface Enterprise {
  id: string;
  legalName: string;
  registrationNumber: string | null;
  country: string;
  entityType: EntityType;
  kybStatus: KYBStatus;
  kybProviderRef: string | null;
  riskScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface EnterpriseCreateRequest {
  legalName: string;
  registrationNumber?: string;
  country: string;
  entityType: EntityType;
  ubos: UBO[];
  sourceOfFunds: string;
}

export interface EnterpriseUpdateRequest {
  legalName?: string;
  registrationNumber?: string;
  riskScore?: number;
}
