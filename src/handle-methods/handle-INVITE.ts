import { makeResponse } from "../sip-messages/make-response";
import { SipMessage } from "../types";
import { db } from "../database";
import { sendToAsterisk } from "../main";

export const handleInvite = async (message: SipMessage) => {
    // console.log("📋 Received INVITE from:", message);
    
    const ramalRemetente = message.headers.From?.match(/sip:([^_@]+)/)?.[1];
    const ramalDestinatario = message.headers.To?.match(/sip:([^@]+)@/)?.[1];
    const tenant_id = message.headers.From?.match(/sip:[^_]+_([^@]+)@/)?.[1];

    // se o ramal remetente e destinatario forem os mesmos gerar erro
    if (ramalDestinatario === ramalRemetente) {
        console.log("❌ Ramal remetente e destinatário são os mesmos:", ramalDestinatario);
        return makeResponse({
            status: 400,
            reason: "Bad Request",
            message: `Ramal remetente e destinatário não podem ser os mesmos`,
            method: message.method,
            via: message.headers["Via"] || "",
            from: message.headers["From"] || "",
            to: message.headers["To"] || "",
            callId: message.headers["Call-ID"] || "",
            cseq: message.headers["CSeq"] || ""
        });
    }

    const query = await db.query(`
  SELECT 
    e.id,
    e.tenantid,
    e.context,
    e.allow,
    e.disallow,
    e.direct_media,
    e.callerid,
    e.transport,
    e.aors,
    e.auth,
    c.uri,
    c.user_agent,
    c.expiration_time,
    c.via_addr,
    c.via_port,
    c.call_id
  FROM ps_endpoints e
  LEFT JOIN ps_contacts c
    ON c.endpoint = e.id
  WHERE e.id = $1
    AND e.tenantid = $2
`, [`${ramalDestinatario}_${tenant_id}`, tenant_id]);




    const ramal = query.rows[0];

    // verifica se o ramal existe
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

    // verifica se o ramal existente esta registrado
    if (!ramal.uri) {
        console.log("❌ Ramal não registrado:", ramalDestinatario);
        return makeResponse({
            status: 480,
            reason: "Temporarily Unavailable",
            message: `Ramal ${ramalDestinatario} não registrado`,
            method: message.method,
            via: message.headers["Via"] || "",
            from: message.headers["From"] || "",
            to: message.headers["To"] || "",
            callId: message.headers["Call-ID"] || "",
            cseq: message.headers["CSeq"] || ""
        });
    }

    console.log("✅ Ramal encontrado:", ramal);

    // enviando para o asterisk
    await sendToAsterisk(message);

};
