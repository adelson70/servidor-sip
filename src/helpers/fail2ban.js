import fs from "fs";
import path from "path";

const logDir = "/var/log/sip";
const suspiciousLogPath = path.join(logDir, "suspicious.log");

// Garante que o diretório existe
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

export const logSuspicious = (ip, reason) => {
  const line = `${new Date().toISOString()} [${ip}] ${reason}\n`;
  fs.appendFileSync(suspiciousLogPath, line);
};
