import { Controller, Inject, Logger } from '@nestjs/common';
import {
  ClientKafka,
  EventPattern,
  MessagePattern,
  Payload,
} from '@nestjs/microservices';

export type NameWithReverse = {
  name: string;
  reversedName: string;
};

@Controller()
export class MicroserviceController {
  constructor(@Inject('PONG_SERVICE') private client: ClientKafka) {}

  @MessagePattern('hello.topic')
  sayHello(name: string): string {
    return `Hello ${name}!`;
  }

  @EventPattern('ping.topic')
  ping(name: string) {
    this.client.emit('pong.topic', `ping from ${name}!`);
  }

  @EventPattern('payload.topic')
  payload(@Payload() name: NameWithReverse) {
    this.client.emit('payload.response.topic', name);
  }

  async onModuleInit() {
    await this.client.connect();
  }
}
