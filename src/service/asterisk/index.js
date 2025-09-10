// src/services/asterisk.js
require("dotenv").config();

const ambient = process.env.NODE_ENV || 'development';
const AST_HOST = ambient === 'production' ? process.env.AST_HOST_PROD : process.env.AST_HOST_DEV;
const AST_PORT = parseInt(process.env.AST_PORT || '5070', 10);

/**
 * Envia INVITE para o Asterisk garantindo que o To tenha o tenant
 */
async function sendInviteToAsterisk(req, res, ramal, tenant) {
    try {
        const srf = req.srf;

        // Adiciona tenant ao AOR
        const aorWithTenant = `${ramal.number}_${tenant}`;
        const uri = ramal.uri.replace(/^[^@]+/, aorWithTenant).replace(/@.*/, `@${AST_HOST}:${AST_PORT}`);
        console.log(`➡️ Repassando INVITE para Asterisk: ${uri}`);

        // Cria a UAC (User Agent Client) para o INVITE
        const uac = await srf.createUAC(uri, {
            headers: {
                // Asterisk aceita tanto "From" quanto "from", mas é padrão usar capitalize
                From: req.get('From'),
                To: req.get('To').replace(ramal.number, aorWithTenant), // garante que o To tenha tenant
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
