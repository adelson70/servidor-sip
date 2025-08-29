import crypto from "crypto";

export interface SipResponseOptions {
  status: number;                  // 200, 401, 403...
  reason: string;                  // OK, Unauthorized, Forbidden...
  method: string;                  // REGISTER, INVITE...
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
}

export function makeResponse(opts: SipResponseOptions): string {
  const { status, reason, method, via, from, to, callId, cseq, contact, authenticate } = opts;

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

  // sempre fecha com Content-Length
  response += `Content-Length: 0\n\n`;

  return response;
}
