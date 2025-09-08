import fs from "fs";

const suspiciousLogPath = "/var/log/sip/suspicious.log";

export const logSuspicious = (ip, reason) => {
  const line = `${new Date().toISOString()} [${ip}] ${reason}\n`;
  fs.appendFileSync(suspiciousLogPath, line);
};
