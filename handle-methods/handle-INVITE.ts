import { makeResponse } from "../sip-messages/make-response";
import { SipMessage } from "../types";
import { db } from "../database";

export const handleInvite = async (message: SipMessage) => {
    // console.log("📋 Received INVITE from:", message);

    const ramalDestinatario = message.headers.To?.match(/sip:([^@]+)@/)?.[1];
    const tenant_id = message.headers.From?.match(/sip:[^_]+_([^@]+)@/)?.[1];

    // verifica se existe esse ramal para esse tenant
    const query = await db.query("SELECT * FROM ps_endpoints WHERE id = $1 AND tenantid = $2", [`${ramalDestinatario}_${tenant_id}`, tenant_id]);

    const ramal = query.rows[0];
    
    if (!ramal) {
        console.log("❌ Ramal não encontrado:", ramalDestinatario, "para tenant", tenant_id);
        return makeResponse({
            status: 404,
            reason: "Not Found",
            message: `Ramal ${ramalDestinatario} não encontrado`,
            method: message.method,
            via: message.headers["Via"] || "",
            from: message.headers["From"] || "",
            to: message.headers["To"] || "",
            callId: message.headers["Call-ID"] || "",
            cseq: message.headers["CSeq"] || ""
        });
    }

    console.log("✅ Ramal encontrado:");

    const response = 'SIP 200 OK';

    return response;
};
