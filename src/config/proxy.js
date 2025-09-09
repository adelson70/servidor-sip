const dgram = require("dgram");
require("dotenv").config();

const { getIp, addSuspicious } = require("../helpers/fail2ban");

const DOMAIN = process.env.SIP_DOMAIN_PROD || "127.0.0.1";
const DRACHTIO_SIP_PORT = parseInt(process.env.DRACHTIO_SIP_PORT || "8453", 10);

const proxy = dgram.createSocket("udp4");

// Map de clientes ativos: chave = "IP:PORT", valor = objeto {address, port}
// Entradas serão removidas assim que a resposta do drachtio for enviada
const clients = new Map();

proxy.on("message", (msg, rinfo) => {
  const clientKey = `${rinfo.address}:${rinfo.port}`;

  // Whitelist rápida em memória
  if (!getIp(rinfo.address)) {
    addSuspicious(rinfo.address);
    return; // drop
  }

  if (rinfo.address === "127.0.0.1" && rinfo.port === DRACHTIO_SIP_PORT) {
    // Mensagem vinda do drachtio → enviar apenas para o cliente correspondente
    // Aqui você precisa decidir como identificar o cliente correto.
    // Se tiver apenas 1 cliente por vez:
    clients.forEach((client, key) => {
      proxy.send(msg, client.port, client.address, (err) => {
        if (!err) console.log(`📤 Resposta enviada para ${client.address}:${client.port}`);
      });
      clients.delete(key); // remove imediatamente da memória
    });
  } else {
    // Mensagem de cliente → salvar temporariamente e repassar para drachtio
    clients.set(clientKey, { address: rinfo.address, port: rinfo.port });
    proxy.send(msg, DRACHTIO_SIP_PORT, DOMAIN, (err) => {
      if (err) console.error(err);
    });
  }
});

const proxyConnected = (workerPrefix) => {
  proxy.on("listening", () => {
    const address = proxy.address();
    console.log(`${workerPrefix} ✅ Proxy UDP ativo na porta ${address.port}`);
  });

};

module.exports = { proxyConnected };
