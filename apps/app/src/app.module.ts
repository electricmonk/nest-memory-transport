import { DynamicModule } from '@nestjs/common';
import { AppController } from './app.controller';

export class AppModule {
  static register(transport: DynamicModule): DynamicModule {
    return {
      imports: [transport],
      controllers: [AppController],
      module: AppModule,
    };
  }
}
