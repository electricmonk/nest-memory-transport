import { Controller, DynamicModule, Logger } from '@nestjs/common';
import { ReplaySubject } from 'rxjs';
import { EventPattern, Payload } from '@nestjs/microservices';
import { Test } from '@nestjs/testing';
import { MicroserviceModule } from '../../../apps/microservice/src/microservice.module';
import { AppModule } from '../../../apps/app/src/app.module';
import * as request from 'supertest';
import { NameWithReverse } from '../../../apps/microservice/src/microservice.controller';

@Controller()
class TestConsumer {
  pongs = new ReplaySubject<string>();
  payloads = new ReplaySubject<NameWithReverse>();

  @EventPattern('pong.topic')
  onPong(from: string) {
    this.pongs.next(from);
  }

  @EventPattern('payload.response.topic')
  onPayload(@Payload() name: NameWithReverse) {
    this.payloads.next(name);
  }
}

class TestModule {
  static register(transport: any) {
    return {
      imports: [transport],
      controllers: [TestConsumer],
      module: TestModule,
    };
  }
}

async function runMicroservice(pongClient: DynamicModule, serverOptions: any) {
  const microservice = await Test.createTestingModule({
    imports: [
      MicroserviceModule.register([pongClient]),
      TestModule.register(pongClient),
    ],
  }).compile();
  const app = await microservice.createNestMicroservice(serverOptions);
  await app.listen();
  return app;
}

async function runApp(appClient: DynamicModule) {
  const appTestingModule = await Test.createTestingModule({
    imports: [AppModule.register(appClient)],
  }).compile();
  return await appTestingModule.createNestApplication().init();
}

export async function createHarness({
  appClient,
  microserviceClient,
  microserviceOptions,
}: {
  microserviceOptions: any;
  microserviceClient: DynamicModule;
  appClient: DynamicModule;
}) {
  const startMicroservice = runMicroservice(
    microserviceClient,
    microserviceOptions,
  );
  const startApp = runApp(appClient);
  const microservice = await startMicroservice;
  const app = await startApp;

  const testConsumer = microservice.get(TestConsumer);
  return {
    app: request(app.getHttpServer()),
    testConsumer,
    close: async () => {
      await app.close();
      await microservice.close();
    },
  };
}
