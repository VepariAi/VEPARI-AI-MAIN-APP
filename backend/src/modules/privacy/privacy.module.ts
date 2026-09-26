// Privacy module — PROMPT 207.

import { Module } from '@nestjs/common';
import { PrivacyController } from './privacy.controller';
import { PrivacyService } from './privacy.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [PrivacyController],
  providers: [PrivacyService],
  exports: [PrivacyService],
})
export class PrivacyModule {}
