const dgram = require("dgram");
require("dotenv").config();

const { getIp } = require("../helpers/fail2ban");

const ambient = process.env.NODE_ENV || "development";
const DOMAIN = ambient === "production" ? process.env.SIP_DOMAIN_PROD : "127.0.0.1";
const DRACHTIO_SIP_PORT = parseInt(process.env.DRACHTIO_SIP_PORT || "8453", 10);

const proxy = dgram.createSocket("udp4");

// Mantém o último cliente que enviou mensagem
let lastClient = null;

proxy.on("message", (msg, rinfo) => {
  console.log(`${rinfo.address}:${rinfo.port}`);

  console.log(getIp(rinfo.address));

  if (rinfo.address === "127.0.0.1" && rinfo.port === DRACHTIO_SIP_PORT) {
    // Mensagem vinda do drachtio → devolver para o último cliente
    if (lastClient) {
      proxy.send(msg, lastClient.port, lastClient.address, (err) => {
        if (err) {
          console.error("Erro ao enviar resposta para cliente:", err);
        } else {
          console.log(`📤 Resposta enviada para ${lastClient.address}:${lastClient.port}`);
        }
      });
    }
  } else {
    // Mensagem vinda de cliente → salvar e repassar para drachtio
    lastClient = { address: rinfo.address, port: rinfo.port };
    proxy.send(msg, DRACHTIO_SIP_PORT, DOMAIN, (err) => {
      if (err) {
        console.error("Erro ao reenviar mensagem:", err);
      }
    });
  }
});

proxy.bind(5060, () => {
  console.log("✅ Proxy UDP ativo na porta 5060");
});
