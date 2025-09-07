import { RegisterOptions } from './../node_modules/ts-node/dist/index.d';
// import dotenv from 'dotenv';
// import dgram, { RemoteInfo, Socket } from "dgram";
// import { processSipMessage } from "./sip-messages/process-sip-message";
// import { SipMessage } from "./types";
// import { buildSipString } from './sip-messages/build-message-sip';
// dotenv.config();
// import { db } from './database';

// const server: Socket = dgram.createSocket("udp4");
// const PORT = process.env.SIP_PORT ? parseInt(process.env.SIP_PORT) : 5060;
// const HOST = "0.0.0.0";
// const DOMAIN = process.env.SIP_DOMAIN;

// const ASTERISK_IP = process.env.AST_HOST;
// const ASTERISK_PORT = process.env.AST_PORT;

// export const sendMessage = (message: string, rinfo: RemoteInfo, socke: Socket = server) => {
//     const msgBuffer = Buffer.from(message);
//     socke.send(msgBuffer, rinfo.port, rinfo.address, (err) => {
//         if (err) {
//             console.error(`Erro ao enviar mensagem:\n${err.stack}`);
//         }
//     });
// };

// export function sendToAsterisk(sipMessage: SipMessage, socket: Socket = server) {
//     // Monta SIP string usando seu tipo
//     const sipString = buildSipString(sipMessage);

//     const msgBuffer = Buffer.from(sipString);

//     socket.send(msgBuffer, Number(ASTERISK_PORT), ASTERISK_IP, (err) => {
//         if (err) {
//             console.error(`Erro ao enviar mensagem para o Asterisk:\n${err.stack}`);
//         } else {
//             console.log(`Mensagem SIP enviada para Asterisk em ${ASTERISK_IP}:${ASTERISK_PORT}`);
//         }
//     });
// }


// server.on("error", (err: Error) => {
//     console.error(`Erro no servidor:\n${err.stack}`);
//     server.close();
// });

// server.on("message", (msg: Buffer, rinfo: RemoteInfo) => {
//     console.log('message received');
//     console.log('msg', msg.toString('hex'));
//     console.log('rinfo', rinfo);
//     processSipMessage(msg, rinfo);
// });

// server.on("listening", () => {
//     console.log(`Servidor SIP ouvindo em ${DOMAIN}:${PORT}`);
//     db.connect().then(() => {
//         console.log('Conectado ao banco de dados com sucesso.');
//     }).catch((err) => {
//         console.error('Erro ao conectar ao banco de dados:', err);
//     });
// });

// server.bind(PORT, HOST);


import dotenv from 'dotenv';
import Srf from 'drachtio-srf';
// @ts-ignore
import regParser from 'drachtio-mw-registration-parser';
import { db } from './database';

// Handlers customizados
import { handleRegister } from './handle-methods/handle-REGISTER';
import { handleInvite } from './handle-methods/handle-INVITE';
import { handleOptions } from './handle-methods/handle-OPTIONS';

dotenv.config();

const srf = new Srf();

const DOMAIN = process.env.SIP_DOMAIN || 'localhost';
const DRACHTIO_HOST = '127.0.0.1';
const DRACHTIO_PORT = parseInt(process.env.DRACHTIO_PORT || '9022');
const DRACHTIO_SECRET = process.env.DRACHTIO_SECRET || 'cymru';

// 🔌 Conexão com o Drachtio
srf.connect({
  host: DRACHTIO_HOST,
  port: DRACHTIO_PORT,
  secret: DRACHTIO_SECRET
});

srf.on('connect', (err, hp) => {
  if (err) console.error('Erro ao conectar ao Drachtio:', err);
  else console.log(`✅ Conectado ao Drachtio em ${hp}`);
});

srf.on('error', (err) => {
  console.error('❌ Erro no Drachtio:', err);
});

// Conexão com banco
db.connect()
  .then(() => console.log('✅ Conectado ao banco de dados.'))
  .catch((err) => console.error('❌ Erro ao conectar ao banco:', err));

// ---------- 📡 CAPTURA DE EVENTOS SIP ---------- //

// Log básico de todas as requisições
srf.use((req, res, next) => {
  console.log(`📥 Recebido: ${req.method} de ${req.source_address}`);
  next();
});

srf.on('register', async (req, res) => {
  console.log('📋 Requisição REGISTER recebida');
  console.log('req', req);
});

console.log(`🚀 Servidor SIP pronto no domínio ${DOMAIN}`);
