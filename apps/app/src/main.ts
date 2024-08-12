import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClientsModule, Transport } from '@nestjs/microservices';

export async function bootstrap() {
  const app = await NestFactory.create(
    AppModule.register(
      ClientsModule.register([
        {
          name: 'HELLO_SERVICE',
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
      ]),
    ),
  );
  await app.listen(3000);
  return app;
}
