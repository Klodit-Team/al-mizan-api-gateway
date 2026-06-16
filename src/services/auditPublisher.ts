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
    let parsedDetails: any = {};
    try {
      if (event.details) parsedDetails = JSON.parse(event.details);
    } catch (e) {}

    channel.publish(
      config.rabbitmqAuditExchange,
      config.rabbitmqAuditRoutingKey,
      message,
      {
        persistent: true, // survive broker restarts
        contentType: 'application/json',
        timestamp: Date.now(),
        headers: {
          'x-request-id': parsedDetails.requestId || 'unknown',
          'x-source': 'api-gateway',
        },
      },
    );

    logger.debug('Audit event published to RabbitMQ', {
      requestId: parsedDetails.requestId,
      action: event.action,
      path: parsedDetails.path,
    });
  } catch (error) {
    // Never let audit publishing failure affect the request
    let reqId = 'unknown';
    try {
      if (event.details) reqId = JSON.parse(event.details).requestId || 'unknown';
    } catch(e) {}
    
    logger.error('Failed to publish audit event to RabbitMQ', {
      requestId: reqId,
      error: error instanceof Error ? error.message : error,
    });
  }
}
