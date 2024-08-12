import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { MicroserviceModule } from './microservice.module';

export async function bootstrapMicroservice(imports: any[]) {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    MicroserviceModule.register(imports),
    {
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
    },
  );
  await app.listen();
  return app;
}
