import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { LoggingProducer } from './logging.producer';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'LOG_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'logs_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  providers: [LoggingProducer],
  exports: [LoggingProducer],
})
export class RabbitMQModule {}
