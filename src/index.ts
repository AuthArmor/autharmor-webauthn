declare global {
  interface Window {
    AuthArmorWebAuthn: typeof WebAuthnSDK;
  }
}

type CredentialType = "public-key";

interface CredentialParams {
  type: CredentialType;
  alg: number;
}

export interface Credential {
  id: string;
  type: CredentialType;
}

interface ParsedCredential {
  id: Uint8Array;
  type: CredentialType;
}

export interface User {
  id: string;
  name: string;
  displayName: string;
}

interface ParsedUser {
  id: Uint8Array;
  name: string;
  displayName: string;
}

export interface Config {
  webauthnClientId: string;
}

export interface PublicKey {
  allowCredentials?: Credential[];
  excludeCredentials?: Credential[];
  user: User;
  challenge: string;
  authenticatorSelection: {
    authenticatorAttachment: AuthenticatorAttachment;
    requireResidentKey: boolean;
    userVerification: UserVerificationRequirement;
  };
  extensions: Record<string, any>;
  pubKeyCredParams: CredentialParams[];
  rp: {
    id: string;
    name: string;
    icon?: string;
  };
  status?: "ok";
  errorMessage?: string;
  timeout: number;
}

interface ParsedPublicKey {
  allowCredentials?: ParsedCredential[];
  excludeCredentials?: ParsedCredential[];
  user: ParsedUser;
  challenge: Uint8Array;
  authenticatorSelection: {
    authenticatorAttachment: AuthenticatorAttachment;
    requireResidentKey: boolean;
    userVerification: UserVerificationRequirement;
  };
  extensions: Record<string, any>;
  pubKeyCredParams: CredentialParams[];
  rp: {
    id: string;
    name: string;
    icon?: string;
  };
  status?: "ok";
  errorMessage?: string;
  timeout: number;
}

export interface StartRegisterResponse {
  fido2_json_options: string;
  registration_id: string;
  aa_sig: string;
}

export interface StartLoginResponse {
  fido2_json_options: string;
  auth_request_id: string;
  aa_guid: string;
}

export interface CreateResponse {
  authenticator_response_data: {
    id: any;
    rawId: string;
    attestation_object: string;
    authenticator_data: string | undefined;
    client_data: string;
    user_handle: string | undefined;
    extensions: any;
  };
  registration_id: string;
  aa_sig: string;
  webauthn_client_id: string | undefined;
}

export interface GetResponse {
  authenticator_response_data: {
    id: string;
    rawId: string;
    attestation_object: string;
    authenticator_data: string | undefined;
    client_data: string;
    user_handle: string | undefined;
    extensions: any;
  };
  auth_request_id: string;
  aa_guid: string;
  webauthn_client_id: string | undefined;
}

class WebAuthnSDK {
  private webauthnClientId: string;

  constructor({ webauthnClientId = "" }: Config) {
    this.webauthnClientId = webauthnClientId;
  }

  toNormalBase64 = (text: string): string => {
    let encoded = text.replace(/\-/g, "+").replace(/\_/g, "/");
    while (encoded.length % 4) {
      encoded += "=";
    }
    return encoded;
  };

  base64ToArrayBuffer = (base64: string): Uint8Array => {
    const binary_string = window.atob(this.toNormalBase64(base64));
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
  };

  arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = window.btoa(binary);
    return base64
      .replace(/\//g, "_")
      .replace(/\+/g, "-")
      .replace(/[=]/g, "");
  };

  private parsePublicKey = async (
    publicKey: PublicKey
  ): Promise<ParsedPublicKey> => {
    const parsedPublicKey = {
      ...publicKey,
      allowCredentials: publicKey.allowCredentials?.map(credential => ({
        ...credential,
        id: this.base64ToArrayBuffer(credential.id)
      })),
      excludeCredentials: publicKey.excludeCredentials?.map(credential => ({
        ...credential,
        id: this.base64ToArrayBuffer(credential.id)
      })),
      user:
        typeof publicKey.user === "object"
          ? {
              ...publicKey.user,
              id: this.base64ToArrayBuffer(publicKey.user.id)
            }
          : publicKey.user,
      challenge: this.base64ToArrayBuffer(publicKey.challenge)
      // extensions:
      //   decodedPublicKey.extensions &&
      //   decodedPublicKey.extensions.appid
      //     ? {
      //         ...decodedPublicKey.extensions,
      //         appid: undefined
      //       }
      //     : extensions
    };
    console.log("parsedPublicKey:", parsedPublicKey);
    return parsedPublicKey;
  };

  create = async (start: StartRegisterResponse): Promise<CreateResponse> => {
    const parsedKey: ParsedPublicKey = await this.parsePublicKey(
      JSON.parse(start.fido2_json_options)
    );

    const attestation = (await navigator.credentials.create({
      publicKey: parsedKey
    })) as any;

    if (!attestation) {
      throw new Error("Registration failed!");
    }

    const parsedResponse = {
      authenticator_response_data: {
        id: attestation.id,
        rawId: this.arrayBufferToBase64(attestation.rawId),
        attestation_object: this.arrayBufferToBase64(
          attestation.response.attestationObject ||
            attestation.response.authenticatorData
        ),
        authenticator_data: attestation.response.authenticatorData
          ? this.arrayBufferToBase64(attestation.response.authenticatorData)
          : undefined,
        client_data: this.arrayBufferToBase64(
          attestation.response.clientDataJSON
        ),
        user_handle: attestation.response.userHandle
          ? this.arrayBufferToBase64(attestation.response.userHandle)
          : undefined,
        extensions: attestation.getClientExtensionResults()
      },
      registration_id: start.registration_id,
      aa_sig: start.aa_sig,
      webauthn_client_id: this.webauthnClientId
    };

    return parsedResponse;
  };

  get = async (start: StartLoginResponse): Promise<GetResponse> => {
    const parsedKey: ParsedPublicKey = await this.parsePublicKey(
      JSON.parse(start.fido2_json_options)
    );

    const attestation = (await navigator.credentials.get({
      publicKey: parsedKey
    })) as any;

    if (!attestation) {
      throw new Error("Login failed!");
    }

    const parsedResponse = {
      authenticator_response_data: {
        id: attestation.id as string,
        rawId: this.arrayBufferToBase64(attestation.rawId),
        attestation_object: this.arrayBufferToBase64(
          attestation.response.attestationObject ||
            attestation.response.authenticatorData
        ),
        authenticator_data: attestation.response.authenticatorData
          ? this.arrayBufferToBase64(attestation.response.authenticatorData)
          : undefined,
        client_data: this.arrayBufferToBase64(
          attestation.response.clientDataJSON
        ),
        user_handle: attestation.response.userHandle
          ? this.arrayBufferToBase64(attestation.response.userHandle)
          : undefined,
        extensions: attestation.getClientExtensionResults()
      },
      auth_request_id: start.auth_request_id,
      aa_guid: start.aa_guid,
      webauthn_client_id: this.webauthnClientId
    };

    return parsedResponse;
  };
}

window.AuthArmorWebAuthn = WebAuthnSDK;

export default WebAuthnSDK;
