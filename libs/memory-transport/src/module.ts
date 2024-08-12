import { EventEmitter } from 'node:events';
import { DynamicModule } from '@nestjs/common';
import { MemoryTransportClient } from './client';

export class MemoryTransportModule {
  static register(clientId: string, emitter: EventEmitter): DynamicModule {
    return {
      providers: [
        {
          provide: clientId,
          useValue: new MemoryTransportClient(emitter),
        },
      ],
      exports: [clientId],
      module: MemoryTransportModule,
    };
  }
}
