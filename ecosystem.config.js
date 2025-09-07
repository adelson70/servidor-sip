module.exports = {
  apps: [
    {
      name: "servidor-sip",
      script: "./src/main.js",
      watch: true,
      ignore_watch: ["node_modules", "logs"],
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      autorestart: true,
      max_restarts: 10
    }
  ]
};
