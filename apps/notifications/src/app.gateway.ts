import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WsResponse,
} from '@nestjs/websockets';
import { AppService } from './app.service';
import { Socket } from 'socket.io';

@WebSocketGateway()
export class AppGateway
  implements OnGatewayConnection<Socket>, OnGatewayDisconnect<Socket>
{
  constructor(private readonly appService: AppService) {}

  handleConnection(client: Socket, ...args: any[]) {
    console.log('CONNECTED');
  }

  handleDisconnect(client: Socket) {
    console.log('DISCONNECTED');
  }

  @SubscribeMessage('events')
  handleEvent(@MessageBody() data: unknown): WsResponse<unknown> {
    return { event: 'events', data };
  }
}
