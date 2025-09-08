const { db } = require("../../config/database");
const { logSuspicious } = require("../../helpers/fail2ban");

async function handleInvite(req, res) {
  try {
    console.log('📞 INVITE', req.msg.headers);

    // Extrai ramal de origem e tenant
    const origemFull = req.get('From').match(/sip:([^@]+)@/)[1];
    const [ramalOrigem, tenant] = origemFull.split('_');

    // verifica se o ramal de origem esta no banco de dados
    const ramalOrigemExists = await db.query(`
      SELECT id, tenantid FROM ps_endpoints WHERE id = $1 AND tenantid = $2
    `, [ramalOrigem, tenant]);

    if (ramalOrigemExists.rowCount === 0) {
      console.log("❌ Ramal de origem não encontrado ou inválido:", ramalOrigem, "para tenant", tenant);
      logSuspicious(req.source_address, "Failed INVITE - user not found");

      return res.send(403); // Proibido
    }

    // Extrai ramal de destino
    const ramalDestino = req.get('To').match(/sip:([^@]+)@/)[1];

    // Se remetente e destinatário forem iguais
    if (ramalOrigem === ramalDestino) {
      console.log("❌ Tentativa de chamada para o mesmo ramal");
      return res.send(403); // Proibido
    }

    // Consulta no banco
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
    `, [`${ramalDestino}_${tenant}`, tenant]);

    const ramal = query.rows[0];

    // Verifica se o ramal existe
    if (!ramal) {
      console.log("❌ Ramal não encontrado:", ramalDestino, "para tenant", tenant);
      return res.send(404); // Not Found
    }

    // Verifica se o ramal está registrado
    if (!ramal.uri) {
      console.log("❌ Ramal não registrado:", ramalDestino);
      return res.send(480); // Temporarily Unavailable
    }

    console.log("✅ Ramal encontrado:", ramal);

    // Aqui você pode enviar para o Asterisk ou continuar com a lógica
    // await sendToAsterisk(req.msg);

  } catch (err) {
    console.error("Erro no INVITE:", err);
    return res.send(500);
  }
}

module.exports = { handleInvite };
