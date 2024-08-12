# NestJS Memory Transport

This package aims to replace existing NestJS transport layers with a memory-based implementation. 
This is useful for testing purposes, as it allows you to run your application in memory without the need for a network connection.
Specifically, it allows you to write in-process acceptance tests for a monorepo that consists of multiple microservices, without going
out of process.

## Installation

```bash
$ npm install nest-memory-transport
```
## Getting Started

In order to replace existing transports such as Kafka or TCP, you'll need to restructure your NestJS application to allow injection
of the transport layer from the outside. 

### Server
Assuming that your init code looks something like this:
```typescript
async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    MyMicroserviceModule,
    {
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: 'some-client-id',
          brokers: ['localhost:9092'],
        },
        consumer: {
          groupId: 'some-consumer',
        },
      },
    },
  );
  await app.listen();
}
bootstrap();
```

with this:
```typescript
// app.ts
export async function bootstrap(transportOptions: MicroserviceOptions) {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    MyMicroserviceModule,
    transportOptions,
  );
  await app.listen();
}

// main.ts
bootstrap({
  transport: Transport.KAFKA,
  options: {
    client: {
      clientId: 'some-client-id',
      brokers: ['localhost:9092'],
    },
    consumer: {
      groupId: 'some-consumer',
    },
  },
});
```

Then in your test, initialize the same microservice with the memory transport:
```typescript
const emitter = new EventEmitter();
const myMicroService = await bootstrap({
  strategy: new MemoryTransportServer(emitter)
});
```

### Client
Convert your AppModule to a `DynamicModule` that takes the transport layer as a parameter:
```typescript
export class AppModule {
  static register(transport: DynamicModule): DynamicModule {
    return {
      imports: [transport, ...any other imports],
      controllers: [...your controllers],
      providers: [...your providers],
      module: AppModule,
    };
  }
}
```

In your main.ts, initialize the app with the production transport:
```typescript
export async function bootstrap() {
  const app = await NestFactory.create(
    AppModule.register(
      ClientsModule.register([
        {
          name: 'KAFKA_CLIENT',
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'some-client-id',
              brokers: ['localhost:9092'],
            },
            consumer: {
              groupId: 'some-consumer',
            },
          },
        },
      ]),
    ),
  );
  await app.listen(3000);
  return app;
}
```

Then in your test, initialize the same app with the memory transport:
```typescript
const appTestingModule = await Test.createTestingModule({ 
  imports: [AppModule.register(MemoryClientsModule.register({
    name: 'HELLO_SERVICE',
    emitter, // the same emitter declared earlier, shared between all microservices and their clients
  }))],
}).compile();
await appTestingModule.createNestApplication().init();
```

See the [e2e test](./libs/memory-transport/test/app.spec.ts) for a full working example.

## Issues
Ideally, add a failing test to any issue you submit.

## Contributing
If you wish to contribute, please open a PR with a failing test, then implement the feature and make the test pass.