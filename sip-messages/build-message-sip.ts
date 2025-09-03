import { SipMessage } from "../types";

export function buildSipString(message: SipMessage): string {
    // Linha inicial
    const startLine = `${message.method} ${message.uri} ${message.version}`;

    // Headers
    const headers = Object.entries(message.headers)
        .map(([key, value]) => `${capitalizeHeader(key)}: ${value}`)
        .join("\r\n");

    // Retorna SIP completo
    return `${startLine}\r\n${headers}\r\n\r\n${message.body || ""}`;
}

function capitalizeHeader(header: string): string {
    // Transforma 'call-id' em 'Call-ID', 'user-agent' em 'User-Agent'
    return header
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("-");
}