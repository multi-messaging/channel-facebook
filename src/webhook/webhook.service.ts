import {
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { environment } from 'src/config';
@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  verifyWebhook(mode: string, challenge: string, verifyToken: string): string {
    const expectedToken = environment.fb.verifyToken;

    if (mode === 'subscribe' && verifyToken === expectedToken) {
      this.logger.log('✅ Webhook verificado correctamente');
      return challenge;
    } else {
      this.logger.error('❌ Token de verificación inválido');
      throw new RpcException({
        message: 'Token de verificación inválido',
        status: HttpStatus.BAD_REQUEST,
      });
    }
  }

  processIncomingMessage(body: any): { status: string } {
    // Verificar que sea una notificación de Facebook
    if (body.object !== 'page') {
      this.logger.warn('Evento recibido no es de tipo "page":', body.object);
      return { status: 'ignored' };
    }

    // Procesar cada entrada del webhook
    if (body.entry && Array.isArray(body.entry)) {
      body.entry.forEach((entry: any) => {
        this.processPageEntry(entry);
      });
    }

    return { status: 'processed' };
  }

  private processPageEntry(entry: any): void {
    const pageId = entry.id;
    const timeOfEvent = entry.time;

    this.logger.log(
      `📄 Procesando entrada de página: ${pageId} en ${new Date(timeOfEvent)}`,
    );

    // Procesar mensajes si existen
    if (entry.messaging && Array.isArray(entry.messaging)) {
      entry.messaging.forEach((event: any) => {
        this.processMessagingEvent(event, pageId);
      });
    }

    // Aquí se pueden procesar otros tipos de eventos como changes, etc.
  }
  private processMessagingEvent(event: any, pageId: string): void {
    const senderId = event.sender?.id;
    const recipientId = event.recipient?.id;
    const timestamp = event.timestamp;

    this.logger.log(`💬 Evento de mensajería recibido:`);
    this.logger.log(`   - Remitente: ${senderId}`);
    this.logger.log(`   - Destinatario: ${recipientId}`);
    this.logger.log(`   - Timestamp: ${new Date(timestamp)}`);

    // Procesar diferentes tipos de eventos
    if (event.message) {
      this.processMessage(event.message, senderId, pageId, timestamp);
    } else if (event.postback) {
      this.processPostback(event.postback, senderId, pageId, timestamp);
    } else {
      this.logger.debug('Tipo de evento no manejado:', Object.keys(event));
    }
  }
  private processMessage(
    message: any,
    senderId: string,
    pageId: string,
    timestamp: number,
  ): void {
    const messageId = message.mid;
    const messageText = message.text;

    this.logger.log(`📨 Mensaje recibido (ID: ${messageId}):`);

    if (messageText) {
      this.logger.log(`   📝 Texto: "${messageText}"`);
    }

    if (message.attachments) {
      this.logger.log(`   📎 Adjuntos: ${message.attachments.length}`);
      message.attachments.forEach((attachment: any, index: number) => {
        this.logger.log(
          `     ${index + 1}. Tipo: ${attachment.type}, URL: ${attachment.payload?.url || 'N/A'}`,
        );
      });
    }

    // TODO: Aquí se enviará el evento a RabbitMQ/Kafka
    this.publishMessageEvent({
      messageId,
      senderId,
      pageId,
      text: messageText,
      attachments: message.attachments || [],
      timestamp,
      channel: 'facebook',
    });
  }

  /**
   * Procesa postbacks (botones, menús persistentes, etc.)
   */
  private processPostback(
    postback: any,
    senderId: string,
    pageId: string,
    timestamp: number,
  ): void {
    const payload = postback.payload;
    const title = postback.title;

    this.logger.log(`🔘 Postback recibido:`);
    this.logger.log(`   - Payload: ${payload}`);
    this.logger.log(`   - Título: ${title}`);

    // TODO: Aquí se enviará el evento a RabbitMQ/Kafka
    this.publishPostbackEvent({
      payload,
      title,
      senderId,
      pageId,
      timestamp,
      channel: 'facebook',
    });
  }

  /**
   * Mock para envío de eventos de mensaje (futura implementación con RabbitMQ/Kafka)
   */
  private publishMessageEvent(eventData: any): void {
    this.logger.log(
      '🚀 [MOCK] Enviando evento de mensaje:',
      JSON.stringify(eventData, null, 2),
    );

    // TODO: Implementar envío real a broker de mensajes
    // await this.messageQueue.publish('message.received', eventData);
  }

  /**
   * Mock para envío de eventos de postback (futura implementación con RabbitMQ/Kafka)
   */
  private publishPostbackEvent(eventData: any): void {
    this.logger.log(
      '🚀 [MOCK] Enviando evento de postback:',
      JSON.stringify(eventData, null, 2),
    );

    // TODO: Implementar envío real a broker de mensajes
    // await this.messageQueue.publish('postback.received', eventData);
  }
}
