import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { MicroserviceModule } from './microservice.module';

export async function bootstrap(transportOptions: MicroserviceOptions) {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    MicroserviceModule.register([]),
    transportOptions,
  );
  await app.listen();
}
bootstrap({
  transport: Transport.KAFKA,
  options: {
    client: {
      clientId: 'hello',
      brokers: ['localhost:9092'],
    },
    consumer: {
      groupId: 'hello-consumer',
    },
  },
});
