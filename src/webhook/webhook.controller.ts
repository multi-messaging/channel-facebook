import { BadRequestException, Controller, Logger } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { WebhookVerifyDto } from './dto';

@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);
  constructor(private readonly webhookService: WebhookService) {}

  //@Get()
  @MessagePattern('facebook.webhook.verify')
  verifyWebhook(@Payload() webhookVerifyDto: WebhookVerifyDto) {
    const { mode, challenge, verifyToken } = webhookVerifyDto;
    this.logger.log(
      `Verificación de webhook recibida: mode=${mode}, token=${verifyToken}`,
    );
    return this.webhookService.verifyWebhook(mode, challenge, verifyToken);
  }

  //@Post()
  @MessagePattern('facebook.webhook.message')
  receiveMessage(@Payload() body: any) {
    this.logger.log('Mensaje recibido desde Facebook');
    this.logger.debug('Body completo:', JSON.stringify(body, null, 2));

    try {
      return this.webhookService.processIncomingMessage(body);
    } catch (error) {
      this.logger.error('Error procesando mensaje:', error.message);
      throw new BadRequestException('Error procesando el mensaje');
    }
  }
}
