// src/services/asterisk.js
require("dotenv").config();

const ambient = process.env.NODE_ENV || 'development';
const AST_HOST = ambient === 'production' ? process.env.AST_HOST_PROD : process.env.AST_HOST_DEV;
const AST_PORT = parseInt(process.env.AST_PORT || '5070', 10);

async function sendInviteToAsterisk(req, res, ramal) {
    try {
        const srf = req.srf;
        const uri = ramal.uri.replace(/@.*/, `@${AST_HOST}:${AST_PORT}`);
        console.log(`➡️ Repassando INVITE para Asterisk: ${uri}`);

        // Cria a UAC (User Agent Client) para o INVITE
        const uac = await srf.createUAC(uri, {
            headers: {
                from: req.get('From'),
                to: req.get('To'),
                'call-id': req.get('Call-ID'),
                cseq: req.get('CSeq'),
                contact: req.get('Contact') || undefined
            },
            localSdp: req.body
        });

        console.log(`⬅️ Chamada aceita pelo Asterisk: ${uac.status} ${uac.reason}`);

        // Repassa a resposta para o chamador
        res.send(uac.status, {
            headers: uac.getHeaders(),
            body: uac.getBody()
        });

    } catch (err) {
        console.error('❌ Erro ao processar requisição Asterisk:', err);
        if (!res.finalResponseSent) res.send(500);
    }
}

module.exports = { sendInviteToAsterisk };
