import {
  CustomTransportStrategy,
  PacketId,
  ReadPacket,
  Server,
} from '@nestjs/microservices';
import { EventEmitter } from 'node:events';
import {
  ERROR_EVENT,
  MESSAGE_EVENT,
  NO_MESSAGE_HANDLER,
} from '@nestjs/microservices/constants';
import { isString } from '@nestjs/common/utils/shared.utils';
import { Observable } from 'rxjs';
export class MemoryTransportServer
  extends Server
  implements CustomTransportStrategy
{
  readonly transportId = Symbol.for('MemoryTransport');

  constructor(private readonly emitter: EventEmitter) {
    super();
    this.emitter.on(MESSAGE_EVENT, this.handleMessage.bind(this));
  }

  async handleMessage(packet: ReadPacket & PacketId) {
    const pattern = !isString(packet.pattern)
      ? JSON.stringify(packet.pattern)
      : packet.pattern;
    const handler = this.messageHandlers.get(pattern);
    if (!handler) {
      return this.emitter.emit(ERROR_EVENT, {
        id: packet.id,
        status: 'error',
        err: NO_MESSAGE_HANDLER + ` (${pattern})`,
      });
    }
    const response$ = this.transformToObservable(
      await handler(packet.data),
    ) as Observable<any>;

    response$ &&
      this.send(response$, (data) =>
        this.emitter.emit(
          `message_response_${packet.id}`,
          Object.assign(data, { id: packet.id, pattern }),
        ),
      );
  }

  close(): any {
    this.emitter.removeAllListeners();
  }

  listen(callback: () => any): any {
    callback();
  }
}
