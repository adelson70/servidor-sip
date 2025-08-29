import type { RemoteInfo } from "dgram";

export interface SipHeaders {
  via?: string;
  from?: string;
  to?: string;
  "call-id"?: string;
  cseq?: string;
  contact?: string;
  authorization?: string;
  ["www-authenticate"]?: string;
  [key: string]: string | undefined; // fallback para outros headers
}

export interface SipMessage {
  remoteInfo: RemoteInfo;
  method: string;
  uri: string;
  version: string;
  headers: SipHeaders;
  body?: string;
}
