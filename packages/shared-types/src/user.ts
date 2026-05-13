export type UserRole = "admin" | "operator" | "approver" | "auditor";
export type UserStatus = "active" | "invited" | "suspended" | "deleted";

export interface AuthFactor {
  passkey: boolean;
  emailOtp: boolean;
  hardwareKey: boolean;
}

export interface User {
  id: string;
  enterpriseId: string;
  email: string;
  displayName: string | null;
  role: UserRole;
  authFactors: AuthFactor;
  status: UserStatus;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserCreateRequest {
  email: string;
  displayName?: string;
  role: UserRole;
}

export interface UserUpdateRequest {
  role?: UserRole;
  displayName?: string;
}

export interface MemberInviteRequest {
  email: string;
  role: UserRole;
  displayName?: string;
}
