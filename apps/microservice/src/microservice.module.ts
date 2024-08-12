import { MicroserviceController } from './microservice.controller';

export class MicroserviceModule {
  static register(imports: any[]) {
    return {
      imports: imports,
      module: MicroserviceModule,
      controllers: [MicroserviceController],
    };
  }
}
