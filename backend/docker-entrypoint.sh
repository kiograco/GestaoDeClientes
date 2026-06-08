#!/bin/sh

# Certifique-se de que este script seja executável (chmod +x) antes de usá-lo no Dockerfile
# Inicie o aplicativo PM2 com as opções desejadas
# pm2-docker start pm2.config.js
set -e

# Railway mounts one persistent volume per service on lower-cost plans. Keep
# WhatsApp authentication and uploaded media in the same volume when enabled.
if [ -n "$PERSISTENT_DATA_DIR" ]; then
  mkdir -p "$PERSISTENT_DATA_DIR/.wwebjs_auth" "$PERSISTENT_DATA_DIR/public"
  rm -rf /app/.wwebjs_auth /app/public
  ln -s "$PERSISTENT_DATA_DIR/.wwebjs_auth" /app/.wwebjs_auth
  ln -s "$PERSISTENT_DATA_DIR/public" /app/public
fi

npx sequelize db:migrate

if [ "$ENABLE_DEMO_SERVICE_ORDER_SEED" = "true" ]; then
  npx sequelize db:seed --seed 20260608130000-create-demo-service-order-account.js
fi

pm2-docker start ./dist/server.js
