// Security module — 5-layer defense-in-depth shared services.
//
// Global so any feature module can inject EncryptionService (encrypt secrets
// before MySQL storage) and SecurityEventService (record security events).
// Relies on the global PrismaModule and ObservabilityModule being present.

import { Global, Module } from '@nestjs/common';
import { EncryptionService } from '../crypto/encryption.service';
import { SecurityEventService } from './security-event.service';

@Global()
@Module({
  providers: [EncryptionService, SecurityEventService],
  exports: [EncryptionService, SecurityEventService],
})
export class SecurityModule {}
