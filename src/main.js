// main-cluster.js
require('dotenv').config();
const cluster = require('cluster');
const os = require('os');

if (cluster.isMaster) {
  const numCPUs = os.cpus().length;
  console.log((`[MASTER ${process.pid}] Iniciando ${numCPUs} workers`));

  for (let i = 0; i < numCPUs; i++) {
    const worker = cluster.fork();
    console.log((`[MASTER] Worker ${worker.process.pid} criado`));
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log((`[MASTER] Worker ${worker.process.pid} morreu. Reiniciando...`));
    const newWorker = cluster.fork();
    console.log((`[MASTER] Worker ${newWorker.process.pid} reiniciado`));
  });

} else {
  // Worker → instância do SIP Server
  const Srf = require('drachtio-srf');
  const { db } = require('./config/database');
  const { handleRegister } = require('./methods/register');
  const { handleInvite } = require('./methods/invite');
  
  const srf = new Srf();
  const ambient = process.env.NODE_ENV || 'development';
  const DOMAIN = ambient === 'production' ? process.env.SIP_DOMAIN_PROD : process.env.SIP_DOMAIN_DEV;
  const DRACHTIO_PORT = parseInt(process.env.DRACHTIO_PORT || '9022');
  const DRACHTIO_SECRET = process.env.DRACHTIO_SECRET || 'cymru';
  
  const workerPrefix = (`[WORKER ${process.pid}]`);
  require('./config/proxy').proxyConnected(workerPrefix);
  
  srf.connect({ host: DOMAIN, port: DRACHTIO_PORT, secret: DRACHTIO_SECRET });

  srf.on('connect', async (_err, hp) => {
    console.log(`${workerPrefix} Conectado ao CORE SIP`);
    try {
      await db.connect();
      console.log(`${workerPrefix} Banco de dados conectado`);
    } catch (err) {
      console.error(`${workerPrefix} Erro ao conectar ao banco de dados:`, err);
    }
  });

  srf.on('error', (err) => console.error(`${workerPrefix} Erro Drachtio:`, err));

  srf.register(handleRegister);
  srf.invite(handleInvite);

  srf.options((req, res) => {
    console.log(`${workerPrefix} OPTIONS recebido de ${req.source_address}`);
    res.send(200, { headers: { Allow: 'INVITE,ACK,CANCEL,BYE,OPTIONS,REGISTER,NOTIFY' } });
  });

  srf.bye((req, res) => {
    console.log(`${workerPrefix} BYE recebido de ${req.source_address}`);
    res.send(200);
  });

  srf.notify((req, res) => {
    console.log(`${workerPrefix} NOTIFY recebido de ${req.source_address}`);
    res.send(200);
  });

  console.log(`${workerPrefix} Servidor SIP pronto no domínio ${DOMAIN}`);
}
