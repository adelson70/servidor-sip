import { makeResponse } from "../sip-messages/make-response";
import { SipMessage } from "../types";

export const handleOptions = async (message: SipMessage) => {
    console.log("📋 Received OPTIONS from:", message.remoteInfo.address);

    // Retorna apenas um 200 OK informando que o servidor está online
    const response = makeResponse({
        status: 200,
        reason: "OK",
        method: "OPTIONS",
        via: message.headers.via || "",
        from: message.headers.from || "",
        to: message.headers.to || "",
        callId: message.headers["call-id"] || "",
        cseq: message.headers.cseq || "",
        allow: ["INVITE", "ACK", "CANCEL", "OPTIONS", "BYE", "REGISTER"]
    });

    return response;
};
