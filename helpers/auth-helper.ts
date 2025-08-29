import crypto from "crypto";

export interface AuthParams {
  username: string;
  realm: string;
  nonce: string;
  uri: string;
  response: string;
  algorithm: string;
  cnonce: string;
  qop: string;
  nc: string;
}

// 1. Parse do header Authorization
export function parseAuthorizationHeader(header: string): AuthParams {
  const params: Record<string, string> = {};
  const regex = /(\w+)=["]?([^",]+)["]?/g;
  let match;
  while ((match = regex.exec(header))) {
    params[match[1]] = match[2];
  }

  return {
    username: params["username"],
    realm: params["realm"],
    nonce: params["nonce"],
    uri: params["uri"],
    response: params["response"],
    algorithm: params["algorithm"] || "MD5",
    cnonce: params["cnonce"],
    qop: params["qop"],
    nc: params["nc"]
  };
}

// 2. Calcula o response esperado
export function calculateDigestResponse(
  auth: AuthParams,
  method: string,
  password: string
): string {
  const ha1 = md5(`${auth.username}:${auth.realm}:${password}`);
  const ha2 = md5(`${method}:${auth.uri}`);
  return md5(`${ha1}:${auth.nonce}:${auth.nc}:${auth.cnonce}:${auth.qop}:${ha2}`);
}

function md5(input: string): string {
  return crypto.createHash("md5").update(input).digest("hex");
}

// 3. Mock de DB
export function getUserPassword(username: string): string | null {
  const users: Record<string, string> = {
    "2001_tenantA": "1234", // senha mockada
    "2002_tenantB": "abcd"
  };
  return users[username] || null;
}
