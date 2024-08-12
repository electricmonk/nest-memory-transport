import { ClientProxy, ReadPacket, WritePacket } from '@nestjs/microservices';
import { EventEmitter } from 'node:events';
import { MESSAGE_EVENT } from '@nestjs/microservices/constants';

export class MemoryTransportClient extends ClientProxy {
  constructor(private readonly emitter: EventEmitter) {
    super();
  }

  close(): any {
    this.emitter.removeAllListeners();
  }

  public async connect() {}

  protected async dispatchEvent(packet: ReadPacket): Promise<any> {
    this.emitter.emit(MESSAGE_EVENT, packet);
    return packet;
  }

  protected publish(
    partialPacket: ReadPacket,
    callback: (packet: WritePacket) => any,
  ) {
    try {
      const packet = this.assignPacketId(partialPacket);

      this.emitter.once('message_response_' + packet.id, (response) => {
        callback(response);
      });
      this.emitter.emit(MESSAGE_EVENT, packet);

      return () => this.routingMap.delete(packet.id);
    } catch (err) {
      callback({ err });
    }
  }

  public subscribeToResponseOf(): void {} // this is needed to comply with the KafkaClient interface
}
