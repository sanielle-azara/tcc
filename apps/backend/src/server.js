require('dotenv').config();
const app = require('./app');
const config = require('./config/env');
const prisma = require('./config/prisma');

const start = async () => {
  try {
    await prisma.$connect();
    console.info('✅ Database connected');

    app.listen(config.port, () => {
      console.info(`🚀 Server running on port ${config.port}`);
      console.info(`📚 API Docs: http://localhost:${config.port}/api-docs`);
      console.info(`🌱 Environment: ${config.env}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

start();
