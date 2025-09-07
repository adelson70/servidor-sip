import { SipMethod } from '../types';
import type { RemoteInfo } from "dgram";
import { SipMessage } from "../types";
import { handleRegister } from "../handle-methods/handle-REGISTER";
import { handleOptions } from "../handle-methods/handle-OPTIONS";
import { sendMessage } from "../main";
import { handleInvite } from '../handle-methods/handle-INVITE';

const methods: Record<string, (message: SipMessage) => Promise<string | void>> = {
    REGISTER: handleRegister,
    OPTIONS: handleOptions,
    INVITE: handleInvite
};

// export const processSipMessage = async (msg: Buffer, rinfo: RemoteInfo): Promise<void> => {
//     const raw = msg.toString("utf-8");
//     const [headerPart, bodyPart] = raw.split(/\r?\n\r?\n/); // separa headers e body
//     const lines = headerPart.split(/\r?\n/);

//     // primeira linha: METHOD URI VERSION
//     const [method, uri, version] = lines[0].split(" ") as [SipMethod, string, string];

//     const headers: Record<string, string> = {};
//     for (let i = 1; i < lines.length; i++) {
//         const line = lines[i];
//         const sepIndex = line.indexOf(":");
//         if (sepIndex > -1) {
//             const key = line.substring(0, sepIndex).trim();
//             const value = line.substring(sepIndex + 1).trim();
//             headers[key] = value;
//         }
//     }

//     const message: SipMessage = {
//         remoteInfo: rinfo,
//         method,
//         uri,
//         version,
//         headers,
//         body: bodyPart?.trim() || undefined
//     };

//     console.log(`📩 Mensagem SIP recebida de ${rinfo.address}:${rinfo.port} - Método: ${method}`);

//     const response = await methods[message.method]?.(message);

//     if (response) {
//         sendMessage(response, rinfo);
//     }

//     // console.log("📩 SIP Message Parsed:", message);
// };

export const processSipMessage = async (msg: Buffer, rinfo: RemoteInfo): Promise<void> => {
    let raw: string;
    try {
        raw = msg.toString("utf-8");
    } catch (err) {
        console.warn("⚠️ Pacote recebido não é UTF-8 válido:", msg.toString("hex"));
        return;
    }

    const [headerPart, bodyPart] = raw.split(/\r?\n\r?\n/);
    const lines = headerPart.split(/\r?\n/);

    if (lines.length === 0) {
        console.warn(`⚠️ Pacote SIP vazio de ${rinfo.address}:${rinfo.port}`);
        return;
    }

    const parts = lines[0].split(" ");
    if (parts.length !== 3) {
        console.warn(`⚠️ Cabeçalho SIP inválido de ${rinfo.address}:${rinfo.port}:`, lines[0]);
        return;
    }

    const [method, uri, version] = parts as [string, string, string];

    if (!["REGISTER", "OPTIONS", "INVITE"].includes(method)) {
        console.warn(`⚠️ Método SIP desconhecido de ${rinfo.address}:${rinfo.port}: ${method}`);
        return;
    }

    const headers: Record<string, string> = {};
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const sepIndex = line.indexOf(":");
        if (sepIndex > -1) {
            const key = line.substring(0, sepIndex).trim();
            const value = line.substring(sepIndex + 1).trim();
            headers[key] = value;
        }
    }

    const message: SipMessage = {
        remoteInfo: rinfo,
        method: method as SipMethod,
        uri,
        version,
        headers,
        body: bodyPart?.trim() || undefined
    };

    console.log(`📩 Mensagem SIP válida recebida de ${rinfo.address}:${rinfo.port} - Método: ${method}`);

    const response = await methods[message.method]?.(message);

    if (response) {
        sendMessage(response, rinfo);
    }
};
