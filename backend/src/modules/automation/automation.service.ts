// Automation engine: Trigger → Condition → Action → Audit log.
// Rules are stored as JSON; execution is server-side only.
// No AI model access directly — actions that need AI route through the AI Gateway module.

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

export type TriggerType =
  | 'LOW_STOCK'
  | 'SALE_RECORDED'
  | 'EXPENSE_RECORDED'
  | 'CUSTOMER_CREDIT_THRESHOLD'
  | 'PAYMENT_OVERDUE'
  | 'DAILY_SUMMARY'
  | 'WEEKLY_SUMMARY';

export type ActionType =
  | 'SEND_NOTIFICATION'
  | 'CREATE_ALERT'
  | 'GENERATE_REPORT'
  | 'TAG_CUSTOMER';

export interface AutomationCondition {
  field: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains';
  value: string | number | boolean;
}

export interface AutomationAction {
  type: ActionType;
  params: Record<string, unknown>;
}

export interface AutomationRule {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  trigger: TriggerType;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastRunAt: Date | null;
  runCount: number;
}

export interface CreateRuleDto {
  name: string;
  description?: string;
  trigger: TriggerType;
  conditions?: AutomationCondition[];
  actions: AutomationAction[];
}

// In-memory store for Phase 15 (DB model will be added via migration in Phase 16)
// Rules are business-scoped in-process; persistence comes with the DB migration.
const ruleStore = new Map<string, AutomationRule>();

@Injectable()
export class AutomationService {
  findAll(businessId: string): AutomationRule[] {
    return Array.from(ruleStore.values())
      .filter(r => r.businessId === businessId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  create(businessId: string, dto: CreateRuleDto): AutomationRule {
    if (!dto.actions.length) throw new BadRequestException('At least one action is required');

    const rule: AutomationRule = {
      id: `auto_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      businessId,
      name: dto.name,
      description: dto.description ?? null,
      trigger: dto.trigger,
      conditions: dto.conditions ?? [],
      actions: dto.actions,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastRunAt: null,
      runCount: 0,
    };

    ruleStore.set(rule.id, rule);
    return rule;
  }

  getById(businessId: string, ruleId: string): AutomationRule {
    const rule = ruleStore.get(ruleId);
    if (!rule || rule.businessId !== businessId) throw new NotFoundException('Automation rule not found');
    return rule;
  }

  update(businessId: string, ruleId: string, dto: Partial<CreateRuleDto> & { isActive?: boolean }): AutomationRule {
    const rule = this.getById(businessId, ruleId);
    if (dto.name !== undefined) rule.name = dto.name;
    if (dto.description !== undefined) rule.description = dto.description ?? null;
    if (dto.trigger !== undefined) rule.trigger = dto.trigger;
    if (dto.conditions !== undefined) rule.conditions = dto.conditions;
    if (dto.actions !== undefined) {
      if (!dto.actions.length) throw new BadRequestException('At least one action is required');
      rule.actions = dto.actions;
    }
    if (dto.isActive !== undefined) rule.isActive = dto.isActive;
    rule.updatedAt = new Date();
    return rule;
  }

  delete(businessId: string, ruleId: string): void {
    const rule = ruleStore.get(ruleId);
    if (!rule || rule.businessId !== businessId) throw new NotFoundException('Automation rule not found');
    ruleStore.delete(ruleId);
  }

  // Called by other services when a trigger event fires
  async evaluate(businessId: string, trigger: TriggerType, context: Record<string, unknown>): Promise<string[]> {
    const rules = this.findAll(businessId).filter(r => r.isActive && r.trigger === trigger);
    const firedRuleIds: string[] = [];

    for (const rule of rules) {
      if (this.checkConditions(rule.conditions, context)) {
        rule.lastRunAt = new Date();
        rule.runCount += 1;
        firedRuleIds.push(rule.id);
        // Action execution hooks would call NotificationsService, etc.
        // Wired in Phase 16 once DB persistence is in place.
      }
    }

    return firedRuleIds;
  }

  private checkConditions(conditions: AutomationCondition[], context: Record<string, unknown>): boolean {
    return conditions.every(cond => {
      const val = context[cond.field];
      if (val === undefined) return false;
      const num = (v: unknown): number => Number(v);
      switch (cond.operator) {
        case 'gt': return num(val) > num(cond.value);
        case 'lt': return num(val) < num(cond.value);
        case 'gte': return num(val) >= num(cond.value);
        case 'lte': return num(val) <= num(cond.value);
        case 'eq': return String(val) === String(cond.value);
        case 'contains': return String(val).includes(String(cond.value));
        default: return false;
      }
    });
  }
}
