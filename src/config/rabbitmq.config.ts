import { RmqOptions, Transport } from '@nestjs/microservices';
import { environment } from './environment';
export const rabbitmqConfig: RmqOptions = {
  transport: Transport.RMQ,
  options: {
    urls: [environment.rabbitmq.url],
    queue: environment.rabbitmq.queue,
    queueOptions: {
      durable: true,
    },
  },
};
