import { Controller, Inject, Logger } from '@nestjs/common';
import {
  ClientKafka,
  EventPattern,
  MessagePattern,
} from '@nestjs/microservices';

@Controller()
export class MicroserviceController {
  constructor(@Inject('PONG_SERVICE') private client: ClientKafka) {}

  private readonly logger = new Logger(MicroserviceController.name);

  @MessagePattern('hello.topic')
  sayHello(name: string): string {
    return `Hello ${name}!`;
  }

  @EventPattern('ping.topic')
  ping(name: string) {
    this.logger.log(`ping from ${name}, sending pong!`);
    this.client.emit('pong.topic', `ping from ${name}!`);
    this.logger.log(`sent pong from ${name}`);
  }

  async onModuleInit() {
    await this.client.connect();
  }
}
