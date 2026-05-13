export interface JwtPayload {
  sub: string;
  enterpriseId: string;
  role: string;
  iat: number;
  exp: number;
  jti: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface WebAuthnCredential {
  id: string;
  credentialId: string;
  publicKey: string;
  signCount: number;
  transports: string[] | null;
  deviceLabel: string | null;
  aaguid: string | null;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface LoginChallenge {
  challenge: string;
  options: Record<string, unknown>;
}

export interface RegisterChallenge {
  challenge: string;
  options: Record<string, unknown>;
}

export interface LoginBeginRequest {
  email: string;
}

export interface LoginCompleteRequest {
  email: string;
  credential: {
    id: string;
    rawId: string;
    response: {
      authenticatorData: string;
      clientDataJSON: string;
      signature: string;
      userHandle?: string;
    };
    type: string;
    clientExtensionResults: Record<string, unknown>;
  };
}

export interface RegisterBeginRequest {
  email: string;
  displayName?: string;
  enterpriseId?: string;
}

export interface RegisterCompleteRequest {
  email: string;
  credential: {
    id: string;
    rawId: string;
    response: {
      attestationObject: string;
      clientDataJSON: string;
    };
    type: string;
    clientExtensionResults: Record<string, unknown>;
  };
  deviceLabel?: string;
}

export interface RecoverBeginRequest {
  email: string;
}

export interface RecoverCompleteRequest {
  email: string;
  otp: string;
}
