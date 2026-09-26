import { Module, OnModuleInit } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ConnectionsController } from './connections.controller';
import { ConnectionWebhookController } from './connection-webhook.controller';
import { ConnectionsService } from './connections.service';
import { AdapterRegistry } from './adapters/adapter-registry.service';
import { OAuthFlowService } from './oauth-flow.service';
import { ConnectionSyncService } from './connection-sync.service';
import { WebhookProcessorService } from './webhook-processor.service';
import { RazorpayAdapter } from './adapters/razorpay.adapter';

@Module({
  imports: [AuthModule],
  controllers: [ConnectionsController, ConnectionWebhookController],
  providers: [
    ConnectionsService,
    AdapterRegistry,
    OAuthFlowService,
    ConnectionSyncService,
    WebhookProcessorService,
  ],
  exports: [
    ConnectionsService,
    AdapterRegistry,
    OAuthFlowService,
    ConnectionSyncService,
    WebhookProcessorService,
  ],
})
export class ConnectionsModule implements OnModuleInit {
  constructor(private readonly registry: AdapterRegistry) {}

  // Register the available provider adapters at startup (PROMPT 231/237).
  onModuleInit(): void {
    this.registry.register(new RazorpayAdapter());
  }
}
