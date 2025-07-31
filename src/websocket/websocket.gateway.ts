import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WebsocketService } from './websocket.service';
import { IRealtimeUpdate } from '../dashboard/interfaces/dashboard.interfaces';

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    tenantId: string;
    role: string;
    email: string;
  };
}

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'], // Frontend URLs
    credentials: true,
  },
  namespace: '/dashboard',
})
export class WebsocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(WebsocketGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly websocketService: WebsocketService,
  ) {}

  afterInit(_server: Server) {
    this.logger.log('Dashboard WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake auth
      const token =
        client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        this.logger.warn(`Client ${client.id} attempted to connect without token`);
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token);
      client.user = {
        id: payload.sub,
        tenantId: payload.tenantId,
        role: payload.role,
        email: payload.email,
      };

      // Join tenant-specific room
      await client.join(`tenant:${client.user.tenantId}`);

      this.logger.log(`Client ${client.id} connected for tenant ${client.user.tenantId}`);

      // Register client connection
      await this.websocketService.registerConnection(client.id, client.user);

      // Send initial connection confirmation
      client.emit('connection:confirmed', {
        message: 'Successfully connected to dashboard updates',
        tenantId: client.user.tenantId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Connection failed for client ${client.id}:`, (error as Error).message);
      client.emit('connection:error', {
        message: 'Authentication failed',
        timestamp: new Date().toISOString(),
      });
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.user) {
      this.logger.log(`Client ${client.id} disconnected from tenant ${client.user.tenantId}`);
      await this.websocketService.unregisterConnection(client.id);
    } else {
      this.logger.log(`Unauthenticated client ${client.id} disconnected`);
    }
  }

  @SubscribeMessage('dashboard:subscribe')
  async handleSubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { filters?: any; updateFrequency?: number },
  ) {
    if (!client.user) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    const { filters = {}, updateFrequency = 30000 } = data; // Default 30 seconds

    this.logger.log(`Client ${client.id} subscribed to dashboard updates with filters:`, filters);

    // Store client subscription preferences
    await this.websocketService.updateSubscription(client.id, {
      tenantId: client.user.tenantId,
      filters,
      updateFrequency,
    });

    client.emit('dashboard:subscribed', {
      message: 'Successfully subscribed to dashboard updates',
      filters,
      updateFrequency,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('dashboard:unsubscribe')
  async handleUnsubscribe(@ConnectedSocket() client: AuthenticatedSocket) {
    if (!client.user) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    this.logger.log(`Client ${client.id} unsubscribed from dashboard updates`);

    await this.websocketService.removeSubscription(client.id);

    client.emit('dashboard:unsubscribed', {
      message: 'Successfully unsubscribed from dashboard updates',
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: AuthenticatedSocket) {
    client.emit('pong', {
      timestamp: new Date().toISOString(),
      clientId: client.id,
    });
  }

  // Methods for broadcasting updates
  async broadcastToTenant(tenantId: string, update: IRealtimeUpdate) {
    this.server.to(`tenant:${tenantId}`).emit('dashboard:update', update);
    this.logger.debug(`Broadcasted ${update.type} update to tenant ${tenantId}`);
  }

  async broadcastMetricsUpdate(tenantId: string, metrics: any) {
    const update: IRealtimeUpdate = {
      type: 'METRICS',
      data: metrics,
      timestamp: new Date(),
      tenantId,
    };

    await this.broadcastToTenant(tenantId, update);
  }

  async broadcastAlertUpdate(tenantId: string, alert: any) {
    const update: IRealtimeUpdate = {
      type: 'ALERT',
      data: alert,
      timestamp: new Date(),
      tenantId,
    };

    await this.broadcastToTenant(tenantId, update);
  }

  async broadcastContentUpdate(tenantId: string, content: any) {
    const update: IRealtimeUpdate = {
      type: 'CONTENT',
      data: content,
      timestamp: new Date(),
      tenantId,
    };

    await this.broadcastToTenant(tenantId, update);
  }

  async broadcastAnalysisUpdate(tenantId: string, analysis: any) {
    const update: IRealtimeUpdate = {
      type: 'ANALYSIS',
      data: analysis,
      timestamp: new Date(),
      tenantId,
    };

    await this.broadcastToTenant(tenantId, update);
  }

  // Get connection stats
  getConnectionStats(): {
    totalConnections: number;
    connectionsByTenant: Record<string, number>;
  } {
    const rooms = this.server.sockets.adapter.rooms;
    const connectionsByTenant: Record<string, number> = {};
    let totalConnections = 0;

    rooms.forEach((sockets, roomName) => {
      if (roomName.startsWith('tenant:')) {
        const tenantId = roomName.replace('tenant:', '');
        connectionsByTenant[tenantId] = sockets.size;
        totalConnections += sockets.size;
      }
    });

    return {
      totalConnections,
      connectionsByTenant,
    };
  }
}
