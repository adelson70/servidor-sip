import type { RemoteInfo } from "dgram";

export interface SipMessage {
    remoteInfo: RemoteInfo;
    method: string;
    uri: string;
    version: string;
    headers: Record<string, string>;
    body?: string;
}