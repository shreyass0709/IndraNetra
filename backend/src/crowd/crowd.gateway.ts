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
import { userFromHeaders } from '../auth/auth.guard';
import { allowedOrigins } from '../common/origins';

// Roles that work incidents. SOS, incident reports and volunteer locations carry
// personal data and go only to these rooms, never to every connected client.
const STAFF_ROOMS = ['role_ADMIN', 'role_ORGANIZER', 'role_VOLUNTEER'];

@WebSocketGateway({
  cors: {
    // Same allowlist as HTTP; a callback so FRONTEND_URL is read at request time.
    origin: (origin: string | undefined, cb: (err: Error | null, ok?: boolean) => void) =>
      cb(null, !origin || allowedOrigins().includes(origin)),
    credentials: true,
  },
  // CORS is only advisory for browsers and doesn't apply to raw WebSockets, so
  // enforce the origin on the server too: a malicious site must not be able to
  // open a socket that rides the user's session cookie. No Origin header means
  // a non-browser client, which still needs a valid session to stay connected.
  allowRequest: (req: any, cb: (err: string | null, ok: boolean) => void) =>
    cb(null, !req.headers.origin || allowedOrigins().includes(req.headers.origin)),
})
export class CrowdGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Every socket must carry a valid session (same cookie as HTTP). Each one joins
  // its own user room and its role room, which the broadcasters below target.
  handleConnection(client: Socket) {
    let user: any = null;
    try {
      user = userFromHeaders(client.handshake.headers.cookie, client.handshake.headers.authorization);
    } catch {
      user = null;
    }
    if (!user) {
      client.disconnect(true);
      return;
    }
    client.data.user = user;
    client.join([`user_${user.id}`, `role_${user.role}`]);
    console.log(`Socket Client connected: ${client.id} (${user.role})`);
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
    this.server.to(STAFF_ROOMS).emit('sos_received', sos);
  }

  // Broadcaster for volunteer location updates
  broadcastVolunteerUpdate(volunteer: any) {
    this.server.to(STAFF_ROOMS).emit('volunteer_updated', volunteer);
  }

  // Broadcaster for new incident reports (real-time control-room feed)
  broadcastReport(report: any) {
    this.server.to(STAFF_ROOMS).emit('report_received', report);
  }

  // Broadcaster for an alert being resolved/acknowledged
  broadcastAlertResolved(alert: any) {
    this.server.emit('alert_resolved', alert);
  }

  // Per-user notification signal, delivered only to that user's own sockets.
  broadcastNotification(userId: string, notification: any) {
    this.server.to(`user_${userId}`).emit('notification', { userId, ...notification });
  }
}
