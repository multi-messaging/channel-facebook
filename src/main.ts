import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { environment } from './config';

async function bootstrap() {
  const logger = new Logger('Channel - Facebook');
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.setGlobalPrefix('api/v1');
  await app.listen(environment.port);

  logger.log(`Channel - Facebook is running on: ${environment.port}`);
}
bootstrap();
