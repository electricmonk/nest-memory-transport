import { Controller, DynamicModule, Logger } from '@nestjs/common';
import { ReplaySubject } from 'rxjs';
import { EventPattern } from '@nestjs/microservices';
import { Test } from '@nestjs/testing';
import { MicroserviceModule } from '../../../apps/microservice/src/microservice.module';
import { AppModule } from '../../../apps/app/src/app.module';
import * as request from 'supertest';

@Controller()
class TestConsumer {
  pongs = new ReplaySubject<string>();
  private readonly logger = new Logger(TestConsumer.name);

  @EventPattern('pong.topic')
  onPong(from: string) {
    this.logger.log(`received pong from ${from}`);
    this.pongs.next(from);
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
