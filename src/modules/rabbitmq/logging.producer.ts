import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class LoggingProducer {
  constructor(
    @Inject('LOG_SERVICE')
    private client: ClientProxy,
  ) {}

  log(data: any) {
    return this.client.emit('log_event', data);
  }
}
