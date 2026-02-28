import amqplib from 'amqplib';
import { config } from './index';
import logger from '../utils/logger';

let connection: amqplib.ChannelModel | null = null;
let channel: amqplib.Channel | null = null;

export async function connectRabbitMQ(): Promise<void> {
  const maxRetries = 5;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      attempt++;
      logger.info(`RabbitMQ connection attempt ${attempt}/${maxRetries}...`);

      connection = await amqplib.connect(config.rabbitmqUrl);
      channel = await connection.createChannel();

      // Assert the audit exchange (durable, topic type)
      await channel.assertExchange(config.rabbitmqAuditExchange, 'topic', {
        durable: true,
      });

      // Assert the audit queue (durable)
      await channel.assertQueue(config.rabbitmqAuditQueue, {
        durable: true,
      });

      // Bind queue to exchange with routing key
      await channel.bindQueue(
        config.rabbitmqAuditQueue,
        config.rabbitmqAuditExchange,
        config.rabbitmqAuditRoutingKey,
      );

      logger.info('RabbitMQ connected, exchange and queue asserted');

      // Handle connection close
      connection.on('close', () => {
        logger.warn('RabbitMQ connection closed, attempting reconnect...');
        channel = null;
        connection = null;
        setTimeout(() => connectRabbitMQ(), 5000);
      });

      connection.on('error', (err) => {
        logger.error('RabbitMQ connection error', { error: err.message });
      });

      return;
    } catch (error) {
      logger.error(`RabbitMQ connection attempt ${attempt} failed`, { error });
      if (attempt >= maxRetries) {
        logger.error('RabbitMQ max retries reached. Gateway will operate without audit publishing.');
        return; // Don't throw — allow degraded mode
      }
      await new Promise((resolve) => setTimeout(resolve, 3000 * attempt));
    }
  }
}

export function getRabbitMQChannel(): amqplib.Channel | null {
  return channel;
}

export async function disconnectRabbitMQ(): Promise<void> {
  try {
    if (channel) {
      await channel.close();
      channel = null;
    }
    if (connection) {
      await connection.close();
      connection = null;
    }
    logger.info('RabbitMQ disconnected gracefully');
  } catch (error) {
    logger.error('Error disconnecting RabbitMQ', { error });
  }
}
