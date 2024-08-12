import { Controller, Get, Inject, Logger, Query } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller()
export class AppController {
  constructor(@Inject('HELLO_SERVICE') private client: ClientKafka) {}

  private readonly logger = new Logger(AppController.name);

  @Get('hello')
  async sayHello(@Query('name') name: string): Promise<string> {
    const result = this.client.send('hello.topic', name);
    const val = await firstValueFrom(result);
    return val;
  }

  @Get('ping')
  async ping(@Query('name') name: string) {
    this.logger.log(`pinging ${name}`);
    await this.client.emit('ping.topic', name);
    this.logger.log(`pinged ${name}`);
  }

  async onModuleInit() {
    await this.client.subscribeToResponseOf('hello.topic');
    await this.client.connect();
  }
}
