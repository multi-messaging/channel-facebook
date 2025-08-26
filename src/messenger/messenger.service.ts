import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { SendMessageDto } from './dto';
import { environment } from 'src/config';
// Interfaces para templates específicos de Facebook
export interface GenericTemplateElement {
  title: string;
  subtitle?: string;
  image_url?: string;
  default_action?: {
    type: 'web_url';
    url: string;
    webview_height_ratio?: 'compact' | 'tall' | 'full';
  };
  buttons?: TemplateButton[];
}

export interface TemplateButton {
  type: 'web_url' | 'postback' | 'phone_number' | 'element_share' | 'account_link' | 'account_unlink';
  title: string;
  url?: string;
  payload?: string;
  phone_number?: string;
  webview_height_ratio?: 'compact' | 'tall' | 'full';
}

export interface MediaTemplateElement {
  media_type: 'image' | 'video';
  url?: string;
  attachment_id?: string;
  buttons?: TemplateButton[];
}

export interface ButtonTemplate {
  text: string;
  buttons: TemplateButton[];
}

export interface ReceiptTemplateElement {
  title: string;
  subtitle?: string;
  quantity?: number;
  price: number;
  currency?: string;
  image_url?: string;
}

export interface ReceiptTemplate {
  recipient_name: string;
  merchant_name?: string;
  order_number: string;
  currency: string;
  payment_method: string;
  summary: {
    subtotal?: number;
    shipping_cost?: number;
    total_tax?: number;
    total_cost: number;
  };
  elements: ReceiptTemplateElement[];
  address?: {
    street_1: string;
    street_2?: string;
    city: string;
    postal_code: string;
    state: string;
    country: string;
  };
  adjustments?: Array<{
    name: string;
    amount: number;
  }>;
}


@Injectable()
export class MessengerService {
  private readonly logger = new Logger(MessengerService.name);
  private readonly PAGE_ACCESS_TOKEN =
    'EAAZAekT0PZBucBPeHKT27HDO3n5JkpujkVR892jcv6akhQ1FBR43lv7tVRIT4FGjvWYTgZAWmL81rZCWZCS9ThBQGQlZAMqkEscKZCy0xsMdBKcg8HstQv8LDc4LxFwGoyUwHPwsEZAniZC7kC1LzI3m8MnmBMtqHpIc52a2B0yKPMgZCKqM7OvAGKYyt5UaLRrAFRSo0PZADZALLi1CrMkTfKdD5VvzAwZDZD';

  constructor(private readonly httpService: HttpService) {}

  async sendTextMessage(recipientId: string, text: string): Promise<any> {
    const messageData: SendMessageDto = {
      recipientId,
      message: {
        text,
      },
      messaging_type: 'RESPONSE',
    };

    return this.sendMessage(messageData);
  }

  /**
   * Envía un mensaje con respuestas rápidas
   */
  async sendMessageWithQuickReplies(
    recipientId: string,
    text: string,
    quickReplies: Array<{ title: string; payload: string }>,
  ): Promise<any> {
    const messageData: SendMessageDto = {
      recipientId,
      message: {
        text,
        quick_replies: quickReplies.map((reply) => ({
          content_type: 'text',
          title: reply.title,
          payload: reply.payload,
        })),
      },
      messaging_type: 'RESPONSE',
    };

    return this.sendMessage(messageData);
  }

  /**
   * Envía un archivo adjunto (imagen, video, etc.)
   */
  async sendAttachment(
    recipientId: string,
    type: 'image' | 'audio' | 'video' | 'file',
    url: string,
  ): Promise<any> {
    const messageData: SendMessageDto = {
      recipientId,
      message: {
        attachment: {
          type,
          payload: {
            url,
            is_reusable: true,
          },
        },
      },
      messaging_type: 'RESPONSE',
    };

    return this.sendMessage(messageData);
  }

  /**
   * Envía un mensaje genérico usando la estructura completa
   */
  async sendMessage(messageData: SendMessageDto): Promise<any> {
    const pageAccessToken = this.PAGE_ACCESS_TOKEN;

    if (!pageAccessToken) {
      throw new BadRequestException('FB_PAGE_ACCESS_TOKEN no configurado');
    }

    const url = `${environment.fb.graphApiUrl}/me/messages`;

    const payload = {
      recipient: {
        id: messageData.recipientId,
      },
      message: messageData.message,
      messaging_type: messageData.messaging_type || 'RESPONSE',
    };

    // Agregar tag si se especifica
    if (messageData.tag) {
      payload['tag'] = messageData.tag;
    }

    const config = {
      params: {
        access_token: pageAccessToken,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    };

    try {
      this.logger.log(`📤 Enviando mensaje a ${messageData.recipientId}`);
      this.logger.debug('Payload:', JSON.stringify(payload, null, 2));

      const response = await firstValueFrom(
        this.httpService.post(url, payload, config),
      );

      this.logger.log(
        `✅ Mensaje enviado exitosamente. ID: ${response.data.message_id}`,
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        '❌ Error enviando mensaje:',
        error.response?.data || error.message,
      );

      if (error.response?.data) {
        throw new BadRequestException({
          message: 'Error enviando mensaje a Facebook',
          error: error.response.data,
        });
      }

      throw new BadRequestException('Error de conexión con Facebook API');
    }
  }

  /**
   * Marca un mensaje como leído
   */
  async markAsRead(senderId: string): Promise<any> {
    const pageAccessToken = this.PAGE_ACCESS_TOKEN;

    if (!pageAccessToken) {
      throw new BadRequestException('FB_PAGE_ACCESS_TOKEN no configurado');
    }

    const url = `${environment.fb.graphApiUrl}/me/messages`;

    const payload = {
      recipient: {
        id: senderId,
      },
      sender_action: 'mark_seen',
    };

    const config = {
      params: {
        access_token: pageAccessToken,
      },
    };

    try {
      await firstValueFrom(this.httpService.post(url, payload, config));
      this.logger.log(`👁️ Mensaje marcado como leído para ${senderId}`);
    } catch (error) {
      this.logger.error(
        'Error marcando como leído:',
        error.response?.data || error.message,
      );
    }
  }

  /**
   * Muestra indicador de "escribiendo..."
   */
  async sendTypingIndicator(recipientId: string): Promise<void> {
    const pageAccessToken = this.PAGE_ACCESS_TOKEN;

    if (!pageAccessToken) {
      throw new BadRequestException('FB_PAGE_ACCESS_TOKEN no configurado');
    }

    const url = `${environment.fb.graphApiUrl}/me/messages`;

    const payload = {
      recipient: {
        id: recipientId,
      },
      sender_action: 'typing_on',
    };

    const config = {
      params: {
        access_token: pageAccessToken,
      },
    };

    try {
      await firstValueFrom(this.httpService.post(url, payload, config));
      this.logger.log(`⌨️ Indicador de escritura enviado a ${recipientId}`);
    } catch (error) {
      this.logger.error(
        'Error enviando indicador de escritura:',
        error.response?.data || error.message,
      );
    }
  }

  /**
   * Obtiene información del perfil del usuario
   */
  async getUserProfile(userId: string): Promise<any> {
    const pageAccessToken = this.PAGE_ACCESS_TOKEN;

    if (!pageAccessToken) {
      throw new BadRequestException('FB_PAGE_ACCESS_TOKEN no configurado');
    }

    const url = `${environment.fb.graphApiUrl}/${userId}`;

    const config = {
      params: {
        fields: 'first_name,last_name,profile_pic,locale,timezone',
        access_token: pageAccessToken,
      },
    };

    try {
      const response = await firstValueFrom(this.httpService.get(url, config));
      this.logger.log(
        `👤 Perfil obtenido para ${userId}: ${response.data.first_name} ${response.data.last_name}`,
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        'Error obteniendo perfil de usuario:',
        error.response?.data || error.message,
      );
      throw new BadRequestException('Error obteniendo información del usuario');
    }
  }
}
