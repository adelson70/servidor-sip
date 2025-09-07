import crypto from "crypto";
import { SipMethod } from "../types";

export interface SipResponseOptions {
  status: number;                  // 200, 401, 403...
  reason: string;                  // OK, Unauthorized, Forbidden...
  method: SipMethod;               // REGISTER, INVITE...
  via: string;
  from: string;
  to: string;
  callId: string;
  cseq: string;
  contact?: string;
  authenticate?: {                 // usado só em 401
    realm: string;
    nonce?: string;
  };
  allow?: SipMethod[];
  message?: string;
}

export function makeResponse(opts: SipResponseOptions): string {
  const { status, reason, method, via, from, to, callId, cseq, contact, authenticate, allow, message } = opts;

  // monta as linhas comuns
  let response =
`SIP/2.0 ${status} ${reason}
Via: ${via}
From: ${from}
To: ${to}${status === 200 ? `;tag=${crypto.randomBytes(4).toString("hex")}` : ""}
Call-ID: ${callId}
CSeq: ${cseq}
`;

  // adiciona Contact se existir
  if (contact) {
    response += `Contact: ${contact}\n`;
  }

  // adiciona WWW-Authenticate se for 401
  if (status === 401 && authenticate) {
    const nonce = authenticate.nonce || crypto.randomBytes(16).toString("hex");
    response += `WWW-Authenticate: Digest realm="${authenticate.realm}", nonce="${nonce}", algorithm=MD5, qop="auth"\n`;
  }

  const body = message || "";

  // sempre fecha com Content-Length
  response += `Content-Length: ${Buffer.byteLength(body)}\n\n${body}`;

  return response;
}
