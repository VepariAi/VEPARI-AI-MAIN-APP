import { Injectable, NotFoundException } from '@nestjs/common';

export type PlanId = 'FREE' | 'STARTER' | 'GROWTH' | 'PRO';
export type BillingCycle = 'MONTHLY' | 'ANNUAL';
export type SubscriptionStatus = 'ACTIVE' | 'TRIALING' | 'CANCELLED' | 'EXPIRED';

export interface Plan {
  id: PlanId;
  name: string;
  monthlyPriceInPaise: number;
  annualPriceInPaise: number;
  features: string[];
  limits: {
    teamMembers: number;
    productsLimit: number;
    transactionsPerMonth: number;
    aiInsights: boolean;
    voiceAssistant: boolean;
    offlineSync: boolean;
    exportData: boolean;
    multiDevice: boolean;
    prioritySupport: boolean;
  };
}

export interface Subscription {
  businessId: string;
  planId: PlanId;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: string | null;
  nextBillingDate: string | null;
  priceInPaise: number;
}

const PLANS: Plan[] = [
  {
    id: 'FREE',
    name: 'Free',
    monthlyPriceInPaise: 0,
    annualPriceInPaise: 0,
    features: ['1 team member', 'Up to 50 products', '100 transactions/month', 'Basic reports'],
    limits: {
      teamMembers: 1,
      productsLimit: 50,
      transactionsPerMonth: 100,
      aiInsights: false,
      voiceAssistant: false,
      offlineSync: false,
      exportData: false,
      multiDevice: false,
      prioritySupport: false,
    },
  },
  {
    id: 'STARTER',
    name: 'Starter',
    monthlyPriceInPaise: 49900,
    annualPriceInPaise: 479900,
    features: ['3 team members', 'Up to 500 products', '1,000 transactions/month', 'AI insights', 'Voice assistant', 'Offline sync'],
    limits: {
      teamMembers: 3,
      productsLimit: 500,
      transactionsPerMonth: 1000,
      aiInsights: true,
      voiceAssistant: true,
      offlineSync: true,
      exportData: true,
      multiDevice: false,
      prioritySupport: false,
    },
  },
  {
    id: 'GROWTH',
    name: 'Growth',
    monthlyPriceInPaise: 149900,
    annualPriceInPaise: 1439900,
    features: ['10 team members', 'Unlimited products', 'Unlimited transactions', 'AI insights', 'Voice assistant', 'Offline sync', 'Multi-device', 'Export data'],
    limits: {
      teamMembers: 10,
      productsLimit: -1,
      transactionsPerMonth: -1,
      aiInsights: true,
      voiceAssistant: true,
      offlineSync: true,
      exportData: true,
      multiDevice: true,
      prioritySupport: false,
    },
  },
  {
    id: 'PRO',
    name: 'Pro',
    monthlyPriceInPaise: 299900,
    annualPriceInPaise: 2879900,
    features: ['Unlimited team members', 'Unlimited products', 'Unlimited transactions', 'All AI features', 'Priority support', 'Advanced analytics', 'Custom integrations'],
    limits: {
      teamMembers: -1,
      productsLimit: -1,
      transactionsPerMonth: -1,
      aiInsights: true,
      voiceAssistant: true,
      offlineSync: true,
      exportData: true,
      multiDevice: true,
      prioritySupport: true,
    },
  },
];

// In-memory subscription store — Phase 15; replace with Prisma in Phase 16
const subscriptions = new Map<string, Subscription>();

function defaultSubscription(businessId: string): Subscription {
  const now = new Date();
  const trialEnd = new Date(now);
  trialEnd.setDate(trialEnd.getDate() + 14);
  return {
    businessId,
    planId: 'FREE',
    status: 'TRIALING',
    billingCycle: 'MONTHLY',
    currentPeriodStart: now.toISOString(),
    currentPeriodEnd: trialEnd.toISOString(),
    cancelAtPeriodEnd: false,
    trialEndsAt: trialEnd.toISOString(),
    nextBillingDate: null,
    priceInPaise: 0,
  };
}

@Injectable()
export class BillingService {
  getPlans(): Plan[] {
    return PLANS;
  }

  getPlan(planId: PlanId): Plan {
    const plan = PLANS.find(p => p.id === planId);
    if (!plan) throw new NotFoundException(`Plan ${planId} not found`);
    return plan;
  }

  getSubscription(businessId: string): Subscription {
    if (!subscriptions.has(businessId)) {
      subscriptions.set(businessId, defaultSubscription(businessId));
    }
    return subscriptions.get(businessId)!;
  }

  changePlan(businessId: string, planId: PlanId, billingCycle: BillingCycle): Subscription {
    const plan = this.getPlan(planId);
    const now = new Date();
    const periodEnd = new Date(now);

    if (billingCycle === 'ANNUAL') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    const priceInPaise = billingCycle === 'ANNUAL' ? plan.annualPriceInPaise : plan.monthlyPriceInPaise;

    const sub: Subscription = {
      businessId,
      planId,
      status: planId === 'FREE' ? 'ACTIVE' : 'ACTIVE',
      billingCycle,
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: periodEnd.toISOString(),
      cancelAtPeriodEnd: false,
      trialEndsAt: null,
      nextBillingDate: planId === 'FREE' ? null : periodEnd.toISOString(),
      priceInPaise,
    };

    subscriptions.set(businessId, sub);
    return sub;
  }

  cancelSubscription(businessId: string): Subscription {
    const sub = this.getSubscription(businessId);
    const updated: Subscription = {
      ...sub,
      cancelAtPeriodEnd: true,
      status: 'CANCELLED',
    };
    subscriptions.set(businessId, updated);
    return updated;
  }

  reactivateSubscription(businessId: string): Subscription {
    const sub = this.getSubscription(businessId);
    const updated: Subscription = {
      ...sub,
      cancelAtPeriodEnd: false,
      status: 'ACTIVE',
    };
    subscriptions.set(businessId, updated);
    return updated;
  }
}
