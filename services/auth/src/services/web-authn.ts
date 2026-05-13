import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { config } from "../config.js";
import { logger } from "../lib/logger.js";

const rpID = config.rpId;
const rpName = config.rpName;
const expectedOrigin = [config.rpOrigin, "http://localhost:3000", "http://localhost:3001"];

export async function generatePasskeyRegistrationOptions(
  email: string,
  displayName?: string,
): Promise<any> {
  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: email,
    userDisplayName: displayName || email,
    attestationType: "none",
    authenticatorSelection: {
      residentKey: "required",
      userVerification: "preferred",
    },
  });

  return options;
}

export async function verifyPasskeyRegistration(
  email: string,
  expectedChallenge: string,
  credential: {
    id: string;
    rawId: string;
    response: { attestationObject: string; clientDataJSON: string };
    type: string;
  },
) {
  const verification = await verifyRegistrationResponse({
    response: {
      id: credential.id,
      rawId: credential.rawId,
      response: credential.response,
      type: "public-key",
      clientExtensionResults: {},
    },
    expectedChallenge,
    expectedOrigin,
    expectedRPID: rpID,
    requireUserVerification: false,
  });

  const { verified, registrationInfo } = verification;

  if (!verified || !registrationInfo) {
    throw new Error("Passkey registration verification failed");
  }

  return {
    credentialId: registrationInfo.credentialID,
    publicKey: Buffer.from(registrationInfo.credentialPublicKey).toString("base64"),
    signCount: registrationInfo.counter,
    transports: (registrationInfo.credentialDeviceType ? [registrationInfo.credentialDeviceType] : []) as string[],
    aaguid: registrationInfo.aaguid,
  };
}

export async function generatePasskeyAuthOptions(): Promise<any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return generateAuthenticationOptions({
    rpID,
    userVerification: "preferred",
  });
}

export async function verifyPasskeyAuth(
  expectedChallenge: string,
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
  },
  storedCredential: {
    credentialId: string;
    publicKey: Uint8Array;
    signCount: number;
    transports?: string[];
  },
) {
  const verification = await verifyAuthenticationResponse({
    response: {
      id: credential.id,
      rawId: credential.rawId,
      response: credential.response,
      type: "public-key",
      clientExtensionResults: {},
    },
    expectedChallenge,
    expectedOrigin,
    expectedRPID: rpID,
    authenticator: {
      credentialID: storedCredential.credentialId,
      credentialPublicKey: new Uint8Array(storedCredential.publicKey),
      counter: storedCredential.signCount,
      transports: (storedCredential.transports || []) as any[],
    },
    requireUserVerification: false,
  });

  const { verified, authenticationInfo } = verification;

  return {
    verified,
    newSignCount: authenticationInfo?.newCounter ?? storedCredential.signCount,
  };
}
