import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class CrowdGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Socket Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Socket Client disconnected: ${client.id}`);
  }

  // Allow client to subscribe to a specific event room
  @SubscribeMessage('subscribe_event')
  handleSubscribeEvent(
    @MessageBody() data: { eventId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`event_${data.eventId}`);
    console.log(`Client ${client.id} joined room event_${data.eventId}`);
    return { status: 'subscribed', room: `event_${data.eventId}` };
  }

  // Allow client to unsubscribe from an event room
  @SubscribeMessage('unsubscribe_event')
  handleUnsubscribeEvent(
    @MessageBody() data: { eventId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`event_${data.eventId}`);
    console.log(`Client ${client.id} left room event_${data.eventId}`);
    return { status: 'unsubscribed', room: `event_${data.eventId}` };
  }

  // Broadcaster for crowd report updates
  broadcastCrowdUpdate(eventId: string, updateData: any) {
    this.server.to(`event_${eventId}`).emit('crowd_update', updateData);
    // Also broadcast on global channel for general dashboard view
    this.server.emit('global_crowd_update', { eventId, ...updateData });
  }

  // Broadcaster for alerts
  broadcastAlert(eventId: string, alert: any) {
    this.server.to(`event_${eventId}`).emit('alert_received', alert);
    this.server.emit('global_alert_received', { eventId, ...alert });
  }

  // Broadcaster for SOS events
  broadcastSOS(sos: any) {
    // SOS broadcasts globally to all admins/police/volunteers
    this.server.emit('sos_received', sos);
  }

  // Broadcaster for volunteer location updates
  broadcastVolunteerUpdate(volunteer: any) {
    this.server.emit('volunteer_updated', volunteer);
  }
}
