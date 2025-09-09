const crypto = require("crypto");
const { db } = require("../../config/database");
const { parseAuthorizationHeader, calculateDigestResponse, getUserPassword } = require("./auth.register");
const { logSuspicious } = require("../../helpers/fail2ban");

const ambient = process.env.NODE_ENV || 'development';

async function handleRegister(req, res) {
  try {
    const authHeader = req.msg.headers["authorization"];

    // Sem Authorization → enviar 401 Digest
    if (!authHeader) {
      const nonce = crypto.randomBytes(16).toString("hex");

      const DOMAIN = ambient === 'production' ? process.env.SIP_DOMAIN_PROD : process.env.SIP_DOMAIN_DEV;

      return res.send(401, {
        headers: {
          "WWW-Authenticate": `Digest realm="${DOMAIN}", nonce="${nonce}", algorithm=MD5, qop="auth"`
        }
      });
    }

    // Authorization recebido → validar
    const authParams = parseAuthorizationHeader(authHeader);
    const password = await getUserPassword(authParams.username);

    if (!password) {
      console.log("❌ Usuário não encontrado:", authParams.username, req.source_address);
      return res.send(403);
    }

    const expectedResponse = calculateDigestResponse(authParams, req.msg.method, password);

    if (expectedResponse !== authParams.response) {
      console.log("❌ Response inválido para", authParams.username);
      return res.send(403);
    }

    console.log("🎉 Autenticação OK para", authParams.username);

    // Upsert do contact
    const contactHeader = req.msg.headers["contact"] || "";
    const expiresHeader = req.msg.headers["expires"];
    const contactExpiresMatch = contactHeader.match(/expires="?(\d+)"?/);
    const expires = expiresHeader
      ? parseInt(expiresHeader, 10)
      : contactExpiresMatch
      ? parseInt(contactExpiresMatch[1], 10)
      : 3600;

    const expirationTime = Date.now() + expires * 1000;
    const contactUri = contactHeader.match(/<([^>]+)>/)?.[1] || "";
    const userAgent = req.msg.headers["user-agent"] || "";
    const viaAddr = req.msg.headers["via"]?.match(/SIP\/2.0\/UDP\s+([\d.]+)/)?.[1] || req.source_address;
    const viaPort = parseInt(req.msg.headers["via"]?.match(/SIP\/2.0\/UDP\s+[\d.]+:(\d+)/)?.[1] || "5060", 10);
    const callId = req.msg.headers["call-id"] || "";
    const endpoint = authParams.username;
    const contactId = `${endpoint}@${viaAddr}:${viaPort}`;

    await db.query(
      `
      INSERT INTO ps_contacts (id, uri, expiration_time, user_agent, via_addr, via_port, call_id, endpoint)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT (endpoint)
      DO UPDATE SET
        id = EXCLUDED.id,
        uri = EXCLUDED.uri,
        expiration_time = EXCLUDED.expiration_time,
        user_agent = EXCLUDED.user_agent,
        via_addr = EXCLUDED.via_addr,
        via_port = EXCLUDED.via_port,
        call_id = EXCLUDED.call_id
    `,
      [contactId, contactUri, expirationTime, userAgent, viaAddr, viaPort, callId, endpoint]
    );

    return res.send(200, { headers: { Contact: contactUri, Expires: expires } });
  } catch (err) {
    console.error("Erro no REGISTER:", err);
    return res.send(500);
  }
}

module.exports = { handleRegister };
