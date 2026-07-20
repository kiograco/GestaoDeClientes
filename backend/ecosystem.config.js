module.exports = [
  {
    script: "dist/server.js",
    name: "ncprogrammers-crm-backend",
    // fork, não cluster: o processo gerencia sessões de WhatsApp/Puppeteer
    // com estado por instância, não seguro para múltiplos workers de cluster.
    exec_mode: "fork",
    cron_restart: "00 00 * * *",
    instances: 1,
    watch: false
  }
];
