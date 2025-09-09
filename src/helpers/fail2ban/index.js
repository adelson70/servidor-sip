// const fs = require("fs");
// const path = require("path");
// require("dotenv").config();

// const logDir = "/var/log/sip";
// const suspiciousLogPath = path.join(logDir, "suspicious.log");

// // Garante que o diretório existe
// if (!fs.existsSync(logDir) && process.env.NODE_ENV === 'production') {
//   fs.mkdirSync(logDir, { recursive: true });
// }

// const logSuspicious = (ip, reason) => {
//   const line = `${new Date().toISOString()} [${ip}] ${reason}\n`;
//   fs.appendFileSync(suspiciousLogPath, line);
// };

// module.exports = { logSuspicious };
const firewall = require("./firewall.json");

const getIp = (ip) => {
  return firewall.whitelist[ip];
}

module.exports = { getIp };