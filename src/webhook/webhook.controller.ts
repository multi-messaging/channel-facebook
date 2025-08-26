import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
} from '@nestjs/common';
import { WebhookService } from './webhook.service';

@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);
  constructor(private readonly webhookService: WebhookService) {}

  @Get()
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.challenge') challenge: string,
    @Query('hub.verify_token') verifyToken: string,
  ) {
    this.logger.log(
      `Verificación de webhook recibida: mode=${mode}, token=${verifyToken}`,
    );

    return this.webhookService.verifyWebhook(mode, challenge, verifyToken);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  receiveMessage(@Body() body: any) {
    this.logger.log('Mensaje recibido desde Facebook');
    this.logger.debug('Body completo:', JSON.stringify(body, null, 2));

    try {
      return this.webhookService.processIncomingMessage(body);
    } catch (error) {
      this.logger.error('Error procesando mensaje:', error.message);
      throw new BadRequestException('Error procesando el mensaje');
    }
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      service: 'channel-facebook',
      timestamp: new Date().toISOString(),
    };
  }
}
