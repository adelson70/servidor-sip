const crypto = require("crypto");
const { db } = require("../../config/database");

function md5(input) {
  return crypto.createHash("md5").update(input).digest("hex");
}

// 1. Parse do header Authorization
function parseAuthorizationHeader(header) {
  const params = {};
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
function calculateDigestResponse(auth, method, password) {
  const ha1 = md5(`${auth.username}:${auth.realm}:${password}`);
  const ha2 = md5(`${method}:${auth.uri}`);
  return md5(`${ha1}:${auth.nonce}:${auth.nc}:${auth.cnonce}:${auth.qop}:${ha2}`);
}

function getTenantIdFromUsername(username) {
  const parts = username.split("_");
  return parts.length > 1 ? parts[1] : "";
}

// 3. Busca senha no banco
async function getUserPassword(username) {
  const tenantId = getTenantIdFromUsername(username);
  const extension = await db.query(
    "SELECT id FROM ps_endpoints WHERE id = $1 AND tenantid = $2",
    [username, tenantId]
  );
  if (extension.rows.length === 0) return null;

  const passwordRes = await db.query(
    "SELECT password FROM ps_auths WHERE username = $1",
    [username]
  );
  if (passwordRes.rows.length === 0) return null;

  return passwordRes.rows[0]?.password;
}

module.exports = { parseAuthorizationHeader, calculateDigestResponse, getUserPassword };
