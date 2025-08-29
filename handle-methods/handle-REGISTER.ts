import crypto from "crypto";
import { SipMessage } from "../types";
import { makeResponse } from "../sip-messages/make-response";
import { parseAuthorizationHeader, calculateDigestResponse, getUserPassword } from "../helpers/auth-helper";

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

    const password = getUserPassword(authParams.username);
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
