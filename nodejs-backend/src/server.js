const app = require('./app');
const env = require('./config/env');
const { testConnection } = require('./config/db');

async function start() {
  try {
    await testConnection();
    console.log('Database connection established.');
  } catch (err) {
    console.error('Failed to connect to the database:', err.message);
    console.error('Check DB_HOST, DB_PORT, DB_NAME, DB_USERNAME, DB_PASSWORD in the .env file.');
    process.exit(1);
  }

  const server = app.listen(env.port, () => {
    console.log(`Handmade Store backend running on port ${env.port}`);
    console.log(`API base: http://localhost:${env.port}/api/v1`);
  });

  server.timeout = 120000;

  const shutdown = () => {
    console.log('Shutting down gracefully...');
    server.close(() => process.exit(0));
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start();
