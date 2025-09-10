// src/services/asterisk.js
require("dotenv").config();

const ambient = process.env.NODE_ENV || 'development';
const AST_HOST = ambient === 'production' ? process.env.AST_HOST_PROD : process.env.AST_HOST_DEV;
const AST_PORT = parseInt(process.env.AST_PORT || '5070', 10);

/**
 * Monta o URI completo no formato que o Asterisk espera
 */
function formatAor(ramalNumber, tenant) {
    return `sip:${ramalNumber}_${tenant}@${AST_HOST}:${AST_PORT}`;
}

async function sendInviteToAsterisk(req, res, ramalOrigem, ramalDestino, tenant) {
    try {
        const srf = req.srf;

        // Request-URI deve ser o AOR do destino no Asterisk
        const uri = formatAor(ramalDestino, tenant);

        // Headers devem apontar para o AOR no Asterisk (não para o IP do telefone)
        const fromHeader = `<sip:${ramalOrigem}_${tenant}@${AST_HOST}>;tag=${req.get('From').split('tag=')[1]}`;
        const toHeader = `<sip:${ramalDestino}_${tenant}@${AST_HOST}>`;

        console.log(`➡️ Repassando INVITE para Asterisk: ${uri}`);
        console.log('From:', fromHeader);
        console.log('To:', toHeader);
        console.log('Contact:', req.get('Contact'));

        const uac = await srf.createUAC(uri, {
            headers: {
                From: fromHeader,
                To: toHeader,
                'Call-ID': req.get('Call-ID'),
                CSeq: req.get('CSeq'),
                Contact: req.get('Contact')
            },
            localSdp: req.body
        });

        console.log(`⬅️ Chamada aceita pelo Asterisk: ${uac.status} ${uac.reason}`);

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
