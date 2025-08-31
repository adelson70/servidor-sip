import crypto from "crypto";
import { SipMessage } from "../types";
import { makeResponse } from "../sip-messages/make-response";
import { parseAuthorizationHeader, calculateDigestResponse, getUserPassword } from "../helpers/auth-helper";
import { db } from "../database";

export const handleRegister = async (message: SipMessage) => {
  let response: string = "";
  console.log("📋 Handling REGISTER:", message);

  if (!message.headers["Authorization"]) {
    console.log("⚠️ Sem Authorization, enviando desafio!");

    const realm = "192.168.10.13";
    const nonce = crypto.randomBytes(16).toString("hex");

    response = makeResponse({
      status: 401,
      reason: "Unauthorized",
      method: message.method,
      via: message.headers["Via"] || "",
      from: message.headers["From"] || "",
      to: message.headers["To"] || "",
      callId: message.headers["Call-ID"] || "",
      cseq: message.headers["CSeq"] || "",
      authenticate: { realm, nonce }
    });
  } else {
    console.log("✅ Authorization recebido, validando...");

    const authHeader = message.headers["Authorization"];
    const authParams = parseAuthorizationHeader(authHeader);

    const password = await getUserPassword(authParams.username);

    if (!password) {
      console.log("❌ Usuário não encontrado:", authParams.username);
      return makeResponse({
        status: 403,
        reason: "Forbidden",
        method: message.method,
        via: message.headers["Via"] || "",
        from: message.headers["From"] || "",
        to: message.headers["To"] || "",
        callId: message.headers["Call-ID"] || "",
        cseq: message.headers["CSeq"] || ""
      });
    }

    const expectedResponse = calculateDigestResponse(authParams, message.method, password);

    if (expectedResponse === authParams.response) {
      console.log("🎉 Autenticação OK para", authParams.username);
      response = makeResponse({
        status: 200,
        reason: "OK",
        method: message.method,
        via: message.headers["Via"] || "",
        from: message.headers["From"] || "",
        to: message.headers["To"] || "",
        callId: message.headers["Call-ID"] || "",
        cseq: message.headers["CSeq"] || "",
        contact: message.headers["Contact"] || ""
      });

      // upsert do contact
      const expiresHeader = message.headers["Expires"];
      const contactHeader = message.headers["Contact"] || "";
      const contactExpiresMatch = contactHeader.match(/expires="?(\d+)"?/);

      const expires = expiresHeader
        ? parseInt(expiresHeader, 10)
        : contactExpiresMatch
          ? parseInt(contactExpiresMatch[1], 10)
          : 3600;

      // epoch em milissegundos
      const expirationTime = Date.now() + expires * 1000;

      const contactUri = contactHeader.match(/<([^>]+)>/)?.[1] || "";
      const userAgent = message.headers["User-Agent"] || "";
      const viaAddr = message.headers["Via"]?.match(/SIP\/2.0\/UDP\s+([\d.]+)/)?.[1] || message.remoteInfo.address;
      const viaPort = (
        message.headers["Via"]?.match(/SIP\/2.0\/UDP\s+[\d.]+:(\d+)/)?.[1] || message.remoteInfo.port,
        10
      );
      const callId = message.headers["Call-ID"] || "";
      const endpoint = authParams.username;
      const contactId = `${endpoint}@${viaAddr}:${viaPort}`;

      await db.query(
        `
  INSERT INTO ps_contacts (
    id, uri, expiration_time, user_agent, via_addr, via_port, call_id, endpoint
  )
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
  ON CONFLICT (id)
  DO UPDATE SET
    uri = EXCLUDED.uri,
    expiration_time = EXCLUDED.expiration_time,
    user_agent = EXCLUDED.user_agent,
    via_addr = EXCLUDED.via_addr,
    via_port = EXCLUDED.via_port,
    call_id = EXCLUDED.call_id,
    endpoint = EXCLUDED.endpoint
  `,
        [contactId, contactUri, expirationTime, userAgent, viaAddr, viaPort, callId, endpoint]
      );




    } else {
      console.log("❌ Response inválido!");
      response = makeResponse({
        status: 403,
        reason: "Forbidden",
        method: message.method,
        via: message.headers["Via"] || "",
        from: message.headers["From"] || "",
        to: message.headers["To"] || "",
        callId: message.headers["Call-ID"] || "",
        cseq: message.headers["CSeq"] || ""
      });
    }
  }

  return response;
};
