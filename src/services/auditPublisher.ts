import { getRabbitMQChannel } from '../config/rabbitmq';
import { config } from '../config';
import { AuditEvent } from '../types';
import logger from '../utils/logger';

/**
 * Publish an audit event to RabbitMQ.
 * Fire-and-forget: does not block the response.
 * Falls back to Winston logging if RabbitMQ is unavailable.
 */
export async function publishAuditEvent(event: AuditEvent): Promise<void> {
  try {
    const channel = getRabbitMQChannel();

    if (!channel) {
      // RabbitMQ unavailable — fallback to local logging
      logger.warn('RabbitMQ unavailable, logging audit event locally', {
        audit: event,
      });
      return;
    }

    const message = Buffer.from(JSON.stringify(event));

    channel.publish(
      config.rabbitmqAuditExchange,
      config.rabbitmqAuditRoutingKey,
      message,
      {
        persistent: true, // survive broker restarts
        contentType: 'application/json',
        timestamp: Date.now(),
        headers: {
          'x-request-id': event.requestId,
          'x-source': 'api-gateway',
        },
      },
    );

    logger.debug('Audit event published to RabbitMQ', {
      requestId: event.requestId,
      action: event.action,
      path: event.path,
    });
  } catch (error) {
    // Never let audit publishing failure affect the request
    logger.error('Failed to publish audit event to RabbitMQ', {
      requestId: event.requestId,
      error: error instanceof Error ? error.message : error,
    });
  }
}
