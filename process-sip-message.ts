import type { RemoteInfo } from "dgram";
import { SipMessage } from "./types";
import { handleRegister } from "./handle-methods/handle-REGISTER";
import { sendMessage } from "./server";

const methods: Record<string, (message: SipMessage) => Promise<string | void>> = {
    REGISTER: handleRegister
};

export const processSipMessage = async (msg: Buffer, rinfo: RemoteInfo): Promise<void> => {
    const raw = msg.toString();
    const [headerPart, bodyPart] = raw.split(/\r?\n\r?\n/); // separa headers e body
    const lines = headerPart.split(/\r?\n/);

    // primeira linha: METHOD URI VERSION
    const [method, uri, version] = lines[0].split(" ");

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
        method,
        uri,
        version,
        headers,
        body: bodyPart?.trim() || undefined
    };

    const response = await methods[message.method]?.(message);

    if (response) {
        sendMessage(response, rinfo);
    }

    // console.log("📩 SIP Message Parsed:", message);
};
