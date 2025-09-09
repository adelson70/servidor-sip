require('dotenv').config();
const Srf = require('drachtio-srf');
const { db } = require('./config/database');

const { handleRegister } = require('./methods/register');
const { handleInvite } = require('./methods/invite');


const srf = new Srf();

const ambient = process.env.NODE_ENV || 'development';

const DOMAIN = ambient === 'production' ? process.env.SIP_DOMAIN_PROD : process.env.SIP_DOMAIN_DEV;

// Configurações do Drachtio
const DRACHTIO_PORT = parseInt(process.env.DRACHTIO_PORT || '9022');
const DRACHTIO_SECRET = process.env.DRACHTIO_SECRET || 'cymru';

// ------------------------
// Conexão com o Drachtio
// ------------------------
srf.connect({
    host: DOMAIN,
    port: DRACHTIO_PORT,
    secret: DRACHTIO_SECRET
});

srf.on('connect', (_err, hp) => {
    console.log(`✅ Conectado ao CORE SIP`);
    db.connect()
        .then(() => console.log('✅ Conectado ao banco de dados'))
        .catch(err => console.error('❌ Erro ao conectar ao banco de dados:', err));
});

srf.on('error', (err) => {
    console.error('❌ Erro no Drachtio:', err);
});

// srf.use((req, res, next) => {
//   console.log('📥 RAW SIP recebido:\n', req.msg.raw);
//   if (typeof next === 'function') next();
// });


srf.register(handleRegister);
srf.invite(handleInvite);
srf.options((req, res) => {
    console.log('⚙️ OPTIONS recebido de', req.source_address);
    res.send(200, { headers: { Allow: 'INVITE,ACK,CANCEL,BYE,OPTIONS,REGISTER,NOTIFY' } });
});
srf.bye((req, res) => {
    console.log('📴 BYE recebido de', req.source_address);
    res.send(200);
});
srf.notify((req, res) => {
    console.log('🔔 NOTIFY recebido de', req.source_address);
    res.send(200);
});

console.log(`🚀 Servidor SIP pronto no domínio ${DOMAIN}`);