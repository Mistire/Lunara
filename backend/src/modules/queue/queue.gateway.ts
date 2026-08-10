import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, UseFilters } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../../common/decorators/current-user.decorator';

@WebSocketGateway({
  cors: {
    origin: '*', // Allow all origins for development
  },
  namespace: 'queue',
})
@Injectable()
export class QueueGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Read token from handshake query or auth object
      const token =
        (client.handshake.query?.token as string) ||
        (client.handshake.auth?.token as string);

      if (!token) {
        console.log(`🔌 WebSocket connection rejected: No token provided.`);
        client.disconnect();
        return;
      }

      const secret =
        this.configService.get<string>('JWT_SECRET') ||
        'lunara_jwt_secret_key_change_in_production_2024';

      const payload = this.jwtService.verify<JwtPayload>(token, { secret });

      // Associate socket connection to specific rooms
      const clinicRoom = `clinic:${payload.clinicId}`;
      await client.join(clinicRoom);

      // If doctor joins, register their specific room
      if (payload.role === 'doctor') {
        const doctorRoom = `doctor:${payload.sub}`;
        await client.join(doctorRoom);
      }

      console.log(`🔌 Client ${payload.fullName} connected to WebSocket room: ${clinicRoom}`);
    } catch (err) {
      console.log(`🔌 WebSocket authentication failed:`, err.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`🔌 Client disconnected from WebSocket`);
  }

  broadcastQueueUpdate(clinicId: string, doctorId: string, scheduledDate: string) {
    const clinicRoom = `clinic:${clinicId}`;
    if (this.server) {
      this.server.to(clinicRoom).emit('queueUpdated', {
        doctorId,
        scheduledDate,
      });
      console.log(`📡 Broadcasted queueUpdate for doctor ${doctorId} to clinic ${clinicId}`);
    }
  }
}
