import { ClientsModule, Transport } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { createHarness } from './harness';
import { EventEmitter } from 'node:events';
import { MemoryTransportServer } from '../src';
import { MemoryClientsModule } from '../src';

const transports = [
  {
    transport: 'Memory',
    makeClients: () => {
      const emitter = new EventEmitter();
      const strategy = new MemoryTransportServer(emitter);
      return {
        appClient: MemoryClientsModule.register({
          name: 'HELLO_SERVICE',
          emitter,
        }),
        microserviceClient: MemoryClientsModule.register({
          name: 'PONG_SERVICE',
          emitter,
        }),
        microserviceOptions: {
          strategy,
        },
      };
    },
  },
  {
    transport: 'Kafka',
    makeClients: () => ({
      appClient: ClientsModule.register([
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
      microserviceClient: ClientsModule.register([
        {
          name: 'PONG_SERVICE',
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'pong',
              brokers: ['localhost:9092'],
            },
            consumer: {
              groupId: 'pong-consumer',
            },
          },
        },
      ]),
      microserviceOptions: {
        transport: Transport.KAFKA,
        options: {
          client: {
            brokers: ['localhost:9092'],
          },
        },
      },
    }),
  },
];

describe.each(transports)('$transport Transport', ({ makeClients }) => {
  it('supports message pattern', async () => {
    const { app, close } = await createHarness(makeClients());

    await app
      .get('/hello')
      .query({ name: 'Inigo' })
      .expect(200)
      .expect('Hello Inigo!');

    await close();
  }, 60_000);

  it('supports event pattern', async () => {
    const { app, close, testConsumer } = await createHarness(makeClients());

    await app.get('/ping').query({ name: 'Inigo' }).expect(200);

    const pong = await firstValueFrom(testConsumer.pongs);
    expect(pong).toBe('ping from Inigo!');

    await close();
  }, 60_000);
});
