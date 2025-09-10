// src/services/asterisk.js
require("dotenv").config();

const ambient = process.env.NODE_ENV || 'development';
const AST_HOST = ambient === 'production' ? process.env.AST_HOST_PROD : process.env.AST_HOST_DEV;
const AST_PORT = parseInt(process.env.AST_PORT || '5070', 10);

/**
 * Ajusta um número/ramal para incluir o tenant no AOR
 */
function formatAor(ramalNumber, tenant) {
    return `${ramalNumber}_${tenant}@${AST_HOST}:${AST_PORT}`;
}

async function sendInviteToAsterisk(req, res, ramal) {
    try {
        const srf = req.srf;
        const uri = formatAor(ramal.id.replace(`_${ramal.tenantid}`, ''), ramal.tenantid);
        console.log(`➡️ Repassando INVITE para Asterisk: ${uri}`);

        console.log('ramal', ramal);
        console.log('contact', req.get('Contact'));

        // Corrige headers From/To para incluir tenant
        const fromHeader = req.get('From')?.replace(/<sip:(.*?)@.*?>/, `<sip:$1_${ramal.tenantid}@${AST_HOST}:${AST_PORT}>`);
        const toHeader = `<sip:${ramal.id}@${AST_HOST}:${AST_PORT}>`; // sempre bate exatamente com AOR do destino

        // Cria a UAC (User Agent Client) para o INVITE
        const uac = await srf.createUAC(uri, {
            headers: {
                From: fromHeader,
                To: toHeader,
                'Call-ID': req.get('Call-ID'),
                CSeq: req.get('CSeq'),
                Contact: req.get('Contact') || undefined
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
