import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { HealthModule } from './health/health.module';
import { ObservabilityModule } from './common/observability/observability.module';
import { PrismaModule } from './prisma/prisma.module';
import { EventsModule } from './events/events.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BusinessesModule } from './modules/businesses/businesses.module';
import { TeamModule } from './modules/team/team.module';
import { CustomersModule } from './modules/customers/customers.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { ProductsModule } from './modules/products/products.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { SalesModule } from './modules/sales/sales.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { PurchasesModule } from './modules/purchases/purchases.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { FinanceModule } from './modules/finance/finance.module';
import { OperationsModule } from './modules/operations/operations.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AiModule } from './modules/ai/ai.module';
import { VoiceModule } from './modules/voice/voice.module';
import { SearchModule } from './modules/search/search.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AutomationModule } from './modules/automation/automation.module';
import { ConnectionsModule } from './modules/connections/connections.module';
import { SyncModule } from './modules/sync/sync.module';
import { BillingModule } from './modules/billing/billing.module';
import { UsageModule } from './modules/usage/usage.module';
import { AuditModule } from './modules/audit/audit.module';
import { ReturnsModule } from './modules/returns/returns.module';
import { RealtimeModule } from './modules/realtime/realtime.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 60_000, limit: 200 },
    ]),
    PrismaModule,
    EventsModule,
    ObservabilityModule,
    HealthModule,
    AuthModule,
    UsersModule,
    BusinessesModule,
    TeamModule,
    CustomersModule,
    SuppliersModule,
    ProductsModule,
    InventoryModule,
    SalesModule,
    ExpensesModule,
    PurchasesModule,
    PaymentsModule,
    FinanceModule,
    OperationsModule,
    DocumentsModule,
    ReportsModule,
    AnalyticsModule,
    AiModule,
    VoiceModule,
    SearchModule,
    NotificationsModule,
    AutomationModule,
    ConnectionsModule,
    SyncModule,
    BillingModule,
    UsageModule,
    AuditModule,
    ReturnsModule,
    RealtimeModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
