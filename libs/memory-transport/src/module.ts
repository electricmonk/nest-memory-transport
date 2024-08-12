import { EventEmitter } from 'node:events';
import { DynamicModule } from '@nestjs/common';
import { MemoryTransportClient } from './client';

export class MemoryClientsModule {
  static register({
    name,
    emitter,
  }: {
    name: string;
    emitter: EventEmitter;
  }): DynamicModule {
    return {
      providers: [
        {
          provide: name,
          useValue: new MemoryTransportClient(emitter),
        },
      ],
      exports: [name],
      module: MemoryClientsModule,
    };
  }
}
