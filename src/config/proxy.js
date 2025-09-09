const dgram = require("dgram");
require('dotenv').config();

const ambient = process.env.NODE_ENV || 'development';
const DOMAIN = ambient === 'production' ? process.env.SIP_DOMAIN_PROD : '127.0.0.1';
const DRACHTIO_PORT_SIP = parseInt(process.env.DRACHTIO_PORT_SIP || '8453');

const proxy = dgram.createSocket("udp4");

proxy.on("message", (msg, rinfo) => {
  console.log(`${rinfo.address}:${rinfo.port}`);

  proxy.send(msg, DRACHTIO_PORT_SIP, DOMAIN, (err) => {

    if (err) {
      console.error("Erro ao reenviar mensagem:", err);
    }

    console.log(`Mensagem reenviada para ${DOMAIN}:${DRACHTIO_PORT_SIP}`);
  });
});

const proxyConnected = proxy.bind(5060, () => {
  console.log("✅ Proxy UDP ativo na porta 5060");
});

module.exports = { proxyConnected };