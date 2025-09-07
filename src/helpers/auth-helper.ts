import crypto from "crypto";
import { db } from "../database";

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

const getTenantIdFromUsername = (username: string): string => {
  const parts = username.split("_");
  return parts.length > 1 ? parts[1] : "";
};

// 3. Mock de DB
export async function getUserPassword(username: string): Promise<string | null> {
  // extrai o tenant id
  const tenant_id = getTenantIdFromUsername(username);
  
  // PRIMEIRO VERIFICA SE EXISTE ESSE RAMAL EM PS_ENDPOINTS, username e tenantid
  const extension = await db.query("SELECT id FROM ps_endpoints WHERE id = $1 AND tenantid = $2", [username, tenant_id]);

  if (extension.rows.length === 0) return null;

  const password = await db.query("SELECT password FROM ps_auths WHERE username = $1", [username]);

  if (password.rows.length === 0) return null;

  return password.rows[0]?.password;
}

