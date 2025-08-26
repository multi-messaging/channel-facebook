import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WebhookModule } from './webhook/webhook.module';
import { MessengerModule } from './messenger/messenger.module';

@Module({
  imports: [WebhookModule, MessengerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
