import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../config/redis.service';

interface ClientConnection {
  id: string;
  userId: string;
  tenantId: string;
  role: string;
  email: string;
  connectedAt: Date;
}

interface ClientSubscription {
  tenantId: string;
  filters: any;
  updateFrequency: number;
  lastUpdate?: Date;
}

@Injectable()
export class WebsocketService {
  private readonly logger = new Logger(WebsocketService.name);
  private readonly connections = new Map<string, ClientConnection>();
  private readonly subscriptions = new Map<string, ClientSubscription>();

  constructor(private readonly redis: RedisService) {}

  async registerConnection(clientId: string, user: any): Promise<void> {
    const connection: ClientConnection = {
      id: clientId,
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email,
      connectedAt: new Date(),
    };

    this.connections.set(clientId, connection);

    // Store in Redis for distributed systems
    try {
      await this.redis.set(
        `ws:connection:${clientId}`,
        JSON.stringify(connection),
        3600, // 1 hour TTL
      );
    } catch (error) {
      this.logger.error('Failed to store connection in Redis:', error);
    }

    this.logger.log(`Registered connection ${clientId} for user ${user.email}`);
  }

  async unregisterConnection(clientId: string): Promise<void> {
    const connection = this.connections.get(clientId);

    if (connection) {
      this.connections.delete(clientId);
      this.subscriptions.delete(clientId);

      // Remove from Redis
      try {
        await this.redis.del(`ws:connection:${clientId}`);
        await this.redis.del(`ws:subscription:${clientId}`);
      } catch (error) {
        this.logger.error('Failed to remove connection from Redis:', error);
      }

      this.logger.log(`Unregistered connection ${clientId} for user ${connection.email}`);
    }
  }

  async updateSubscription(clientId: string, subscription: ClientSubscription): Promise<void> {
    this.subscriptions.set(clientId, {
      ...subscription,
      lastUpdate: new Date(),
    });

    // Store in Redis
    try {
      await this.redis.set(
        `ws:subscription:${clientId}`,
        JSON.stringify(subscription),
        3600, // 1 hour TTL
      );
    } catch (error) {
      this.logger.error('Failed to store subscription in Redis:', error);
    }

    this.logger.log(`Updated subscription for client ${clientId}`);
  }

  async removeSubscription(clientId: string): Promise<void> {
    this.subscriptions.delete(clientId);

    try {
      await this.redis.del(`ws:subscription:${clientId}`);
    } catch (error) {
      this.logger.error('Failed to remove subscription from Redis:', error);
    }

    this.logger.log(`Removed subscription for client ${clientId}`);
  }

  getConnection(clientId: string): ClientConnection | undefined {
    return this.connections.get(clientId);
  }

  getSubscription(clientId: string): ClientSubscription | undefined {
    return this.subscriptions.get(clientId);
  }

  getConnectionsByTenant(tenantId: string): ClientConnection[] {
    return Array.from(this.connections.values()).filter(
      (connection) => connection.tenantId === tenantId,
    );
  }

  getSubscriptionsByTenant(
    tenantId: string,
  ): Array<{ clientId: string; subscription: ClientSubscription }> {
    const results: Array<{ clientId: string; subscription: ClientSubscription }> = [];

    this.subscriptions.forEach((subscription, clientId) => {
      if (subscription.tenantId === tenantId) {
        results.push({ clientId, subscription });
      }
    });

    return results;
  }

  getConnectionStats(): {
    totalConnections: number;
    connectionsByTenant: Record<string, number>;
    subscriptionsByTenant: Record<string, number>;
  } {
    const connectionsByTenant: Record<string, number> = {};
    const subscriptionsByTenant: Record<string, number> = {};

    // Count connections by tenant
    this.connections.forEach((connection) => {
      connectionsByTenant[connection.tenantId] =
        (connectionsByTenant[connection.tenantId] || 0) + 1;
    });

    // Count subscriptions by tenant
    this.subscriptions.forEach((subscription) => {
      subscriptionsByTenant[subscription.tenantId] =
        (subscriptionsByTenant[subscription.tenantId] || 0) + 1;
    });

    return {
      totalConnections: this.connections.size,
      connectionsByTenant,
      subscriptionsByTenant,
    };
  }

  // Method to clean up stale connections
  async cleanupStaleConnections(): Promise<void> {
    const now = new Date();
    const maxAge = 2 * 60 * 60 * 1000; // 2 hours

    const staleConnections: string[] = [];

    this.connections.forEach((connection, clientId) => {
      if (now.getTime() - connection.connectedAt.getTime() > maxAge) {
        staleConnections.push(clientId);
      }
    });

    for (const clientId of staleConnections) {
      await this.unregisterConnection(clientId);
    }

    if (staleConnections.length > 0) {
      this.logger.log(`Cleaned up ${staleConnections.length} stale connections`);
    }
  }

  // Method to check if a client should receive an update based on their subscription
  shouldSendUpdate(clientId: string, _updateType: string): boolean {
    const subscription = this.subscriptions.get(clientId);

    if (!subscription) {
      return false;
    }

    // Check if enough time has passed since last update
    if (subscription.lastUpdate) {
      const timeSinceLastUpdate = Date.now() - subscription.lastUpdate.getTime();
      if (timeSinceLastUpdate < subscription.updateFrequency) {
        return false;
      }
    }

    // Add more sophisticated filtering logic here based on subscription.filters
    return true;
  }

  // Method to update last update time for a subscription
  markSubscriptionUpdated(clientId: string): void {
    const subscription = this.subscriptions.get(clientId);
    if (subscription) {
      subscription.lastUpdate = new Date();
      this.subscriptions.set(clientId, subscription);
    }
  }
}
