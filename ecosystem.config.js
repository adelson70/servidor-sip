module.exports = {
  apps: [
    {
      name: "servidor-sip",         // Nome que aparecerá no PM2
      script: "dist/main.js",      // Caminho para o JS gerado pelo build
      instances: 1,                // Pode usar "max" para usar todos os núcleos
      exec_mode: "fork",           // "cluster" se quiser multi-processo
      watch: false,                // Pode habilitar true em dev (não recomendado em prod)
    }
  ]
}
