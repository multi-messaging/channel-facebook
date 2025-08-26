export class SendMessageDto {
  recipientId: string;
  message: {
    text?: string;
    attachment?: {
      type: 'image' | 'audio' | 'video' | 'file' | 'template';
      payload: {
        url?: string;
        is_reusable?: boolean;
        template_type?:
          | 'generic'
          | 'button'
          | 'media'
          | 'receipt'
          | 'airline_boardingpass'
          | 'airline_checkin'
          | 'airline_itinerary'
          | 'airline_update';
        elements?: any[];
        buttons?: any[];
        text?: string;
        sharable?: boolean;
        image_aspect_ratio?: 'horizontal' | 'square';
      };
    };
    quick_replies?: Array<{
      content_type: 'text' | 'location' | 'user_phone_number' | 'user_email';
      title?: string;
      payload?: string;
      image_url?: string;
    }>;
  };
  messaging_type?: 'RESPONSE' | 'UPDATE' | 'MESSAGE_TAG';
  tag?: string;
}
export class SendTextMessageDto {
  recipientId: string;
  text: string;
}

export class SendQuickReplyDto {
  recipientId: string;
  text: string;
  quickReplies: Array<{
    title: string;
    payload: string;
  }>;
}

export class SendAttachmentDto {
  recipientId: string;
  type: 'image' | 'audio' | 'video' | 'file';
  url: string;
}
