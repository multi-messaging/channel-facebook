import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { MessengerService } from './messenger.service';
import {
  SendAttachmentDto,
  SendQuickReplyDto,
  SendTextMessageDto,
} from './dto';
@Controller('messages')
export class MessengerController {
  private readonly logger = new Logger(MessengerController.name);
  constructor(private readonly messengerService: MessengerService) {}

  @Post('text')
  async sendTextMessage(@Body() dto: SendTextMessageDto) {
    if (!dto.recipientId || !dto.text) {
      throw new BadRequestException('recipientId y text son requeridos');
    }

    this.logger.log(
      `Enviando mensaje de texto a ${dto.recipientId}: "${dto.text}"`,
    );

    try {
      const result = await this.messengerService.sendTextMessage(
        dto.recipientId,
        dto.text,
      );
      return {
        success: true,
        messageId: result.message_id,
        recipientId: dto.recipientId,
      };
    } catch (error) {
      this.logger.error('Error enviando mensaje de texto:', error.message);
      throw error;
    }
  }

  /**
   * Envía un mensaje con respuestas rápidas
   * POST /api/v1/messages/quick-reply
   */
  @Post('quick-reply')
  async sendQuickReply(@Body() dto: SendQuickReplyDto) {
    if (!dto.recipientId || !dto.text || !dto.quickReplies) {
      throw new BadRequestException(
        'recipientId, text y quickReplies son requeridos',
      );
    }

    this.logger.log(
      `Enviando mensaje con respuestas rápidas a ${dto.recipientId}`,
    );

    try {
      const result = await this.messengerService.sendMessageWithQuickReplies(
        dto.recipientId,
        dto.text,
        dto.quickReplies,
      );
      return {
        success: true,
        messageId: result.message_id,
        recipientId: dto.recipientId,
      };
    } catch (error) {
      this.logger.error(
        'Error enviando mensaje con respuestas rápidas:',
        error.message,
      );
      throw error;
    }
  }

  /**
   * Envía un archivo adjunto
   * POST /api/v1/messages/attachment
   */
  @Post('attachment')
  async sendAttachment(@Body() dto: SendAttachmentDto) {
    if (!dto.recipientId || !dto.type || !dto.url) {
      throw new BadRequestException('recipientId, type y url son requeridos');
    }

    this.logger.log(
      `Enviando adjunto ${dto.type} a ${dto.recipientId}: ${dto.url}`,
    );

    try {
      const result = await this.messengerService.sendAttachment(
        dto.recipientId,
        dto.type,
        dto.url,
      );
      return {
        success: true,
        messageId: result.message_id,
        recipientId: dto.recipientId,
      };
    } catch (error) {
      this.logger.error('Error enviando adjunto:', error.message);
      throw error;
    }
  }

  /**
   * Marca un mensaje como leído
   * POST /api/v1/messages/mark-read/:userId
   */
  @Post('mark-read/:userId')
  async markAsRead(@Param('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('userId es requerido');
    }

    try {
      await this.messengerService.markAsRead(userId);
      return {
        success: true,
        action: 'marked_as_read',
        userId,
      };
    } catch (error) {
      this.logger.error('Error marcando como leído:', error.message);
      throw error;
    }
  }

  /**
   * Envía indicador de "escribiendo..."
   * POST /api/v1/messages/typing/:userId
   */
  @Post('typing/:userId')
  async sendTypingIndicator(@Param('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('userId es requerido');
    }

    try {
      await this.messengerService.sendTypingIndicator(userId);
      return {
        success: true,
        action: 'typing_indicator_sent',
        userId,
      };
    } catch (error) {
      this.logger.error(
        'Error enviando indicador de escritura:',
        error.message,
      );
      throw error;
    }
  }

  /**
   * Obtiene información del perfil de un usuario
   * GET /api/v1/messages/user/:userId
   */
  @Get('user/:userId')
  async getUserProfile(@Param('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('userId es requerido');
    }

    try {
      const profile = await this.messengerService.getUserProfile(userId);
      return {
        success: true,
        profile,
      };
    } catch (error) {
      this.logger.error('Error obteniendo perfil:', error.message);
      throw error;
    }
  }

  /**
   * Endpoint para probar el envío (útil para desarrollo)
   * POST /api/v1/messages/test
   */
  @Post('test')
  async testMessage(@Body() body: { userId: string }) {
    if (!body.userId) {
      throw new BadRequestException('userId es requerido para la prueba');
    }

    this.logger.log(`🧪 Enviando mensaje de prueba a ${body.userId}`);

    try {
      // Enviar indicador de escritura
      await this.messengerService.sendTypingIndicator(body.userId);

      // Esperar un poco para simular escritura
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Enviar mensaje de prueba
      const result = await this.messengerService.sendTextMessage(
        body.userId,
        '¡Hola! Este es un mensaje de prueba desde el canal de Facebook 🚀',
      );

      return {
        success: true,
        messageId: result.message_id,
        message: 'Mensaje de prueba enviado correctamente',
      };
    } catch (error) {
      this.logger.error('Error en mensaje de prueba:', error.message);
      throw error;
    }
  }
}
