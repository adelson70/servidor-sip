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


// server.ts
import dotenv from 'dotenv';
import Srf, { SrfRequest, SrfResponse } from 'drachtio-srf';
// @ts-ignore
import regParser from 'drachtio-mw-registration-parser';

dotenv.config();

const srf = new Srf();
const DOMAIN = process.env.SIP_DOMAIN || 'localhost';
const DRACHTIO_HOST = process.env.DRACHTIO_HOST || '127.0.0.1';
const DRACHTIO_PORT = parseInt(process.env.DRACHTIO_PORT || '9022');
const DRACHTIO_SECRET = process.env.DRACHTIO_SECRET || 'cymru';

// ------------------------
// Conexão com o Drachtio
// ------------------------
srf.connect({
  host: DRACHTIO_HOST,
  port: DRACHTIO_PORT,
  secret: DRACHTIO_SECRET
});

srf.on('connect', (_err, hp) => {
  console.log(`✅ Conectado ao Drachtio em ${hp}`);
});

srf.on('error', (err) => {
  console.error('❌ Erro no Drachtio:', err);
});

// ------------------------
// Middleware geral (log de requisições)
// ------------------------
srf.use((req, res, next) => {
  console.log(`📥 Método SIP recebido: ${req.method} de ${req.source_address}`);
  if (typeof next === 'function') next();
});

// ------------------------
// REGISTER
// ------------------------
srf.use('register', regParser());

// @ts-ignore
srf.register((req: SrfRequest, res: SrfResponse) => {
  if (!req.registration) {
    console.warn('⚠️ req.registration não definido!');
    return res.send(503);
  }

  console.log('📋 REGISTER recebido:', req.registration);

  res.send(200, {
    headers: {
      'Contact': req.registration.contact,
      'Expires': req.registration.expires || 3600
    }
  });
});

// ------------------------
// INVITE
// ------------------------
srf.invite((req: SrfRequest, res: SrfResponse) => {
  console.log('📞 INVITE recebido de', req.callingNumber || req.source_address);

  // Apenas responde 180 Ringing e 200 OK de teste
  res.send(180, {
    headers: { 'Contact': `<sip:${DOMAIN}>` }
  });

  res.send(200, {
    headers: { 'Contact': `<sip:${DOMAIN}>` },
    body: 'Teste SDP ou mensagem'
  });
});

// ------------------------
// OPTIONS
// ------------------------
// @ts-ignore
srf.options((req: SrfRequest, res: SrfResponse) => {
  console.log('⚙️ OPTIONS recebido de', req.source_address);
  res.send(200, { headers: { Allow: 'INVITE,ACK,CANCEL,BYE,OPTIONS,REGISTER,NOTIFY' } });
});

// ------------------------
// BYE
// ------------------------
// @ts-ignore
srf.bye((req: SrfRequest, res: SrfResponse) => {
  console.log('📴 BYE recebido de', req.source_address);
  res.send(200);
});

// ------------------------
// NOTIFY
// ------------------------
// @ts-ignore
srf.notify((req: SrfRequest, res: SrfResponse) => {
  console.log('🔔 NOTIFY recebido de', req.source_address);
  res.send(200);
});

// ------------------------
console.log(`🚀 Servidor SIP pronto no domínio ${DOMAIN}`);
