import { createApp } from './app';
import { config } from './config';
import { connectRedis, disconnectRedis } from './config/redis';
import { connectRabbitMQ, disconnectRabbitMQ } from './config/rabbitmq';
import logger from './utils/logger';

async function bootstrap(): Promise<void> {
  logger.info('═══════════════════════════════════════════════════════════');
  logger.info('  AL-Mizan API Gateway — Starting...');
  logger.info(`  Environment: ${config.nodeEnv}`);
  logger.info(`  Port: ${config.port}`);
  logger.info('═══════════════════════════════════════════════════════════');

  // ─── Connect to Redis ──────────────────────────────────────────────────
  logger.info('Connecting to Redis...');
  await connectRedis();

  // ─── Connect to RabbitMQ ───────────────────────────────────────────────
  logger.info('Connecting to RabbitMQ...');
  await connectRabbitMQ();

  // ─── Build Express App ─────────────────────────────────────────────────
  const app = createApp();

  // ─── Start HTTP Server ─────────────────────────────────────────────────
  const server = app.listen(config.port, () => {
    logger.info('═══════════════════════════════════════════════════════════');
    logger.info(`  API Gateway is running on port ${config.port}`);
    logger.info(`  Health: http://localhost:${config.port}/health`);
    logger.info(`  Ready:  http://localhost:${config.port}/ready`);
    logger.info(`  Docs:   http://localhost:${config.port}/docs`);
    logger.info(`  OpenAPI JSON: http://localhost:${config.port}/docs.json`);
    logger.info('═══════════════════════════════════════════════════════════');
  });

  // ─── Graceful Shutdown ─────────────────────────────────────────────────
  const shutdown = async (signal: string) => {
    logger.info(`\n${signal} received. Graceful shutdown starting...`);

    // Stop accepting new connections
    server.close(async () => {
      logger.info('HTTP server closed');

      try {
        await disconnectRedis();
        await disconnectRabbitMQ();
        logger.info('All connections closed. Goodbye.');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown', { error });
        process.exit(1);
      }
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // ─── Uncaught Exception / Rejection Handling ───────────────────────────
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection', { reason });
  });
}

bootstrap().catch((error) => {
  logger.error('Fatal error during bootstrap', { error });
  process.exit(1);
});
