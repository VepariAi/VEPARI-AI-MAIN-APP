// In-app notification store. Persistent DB model comes in Phase 16 migration.
// Notifications are business-scoped and user-scoped where relevant.

import { Injectable } from '@nestjs/common';

export type NotificationCategory =
  | 'ALERT'
  | 'LOW_STOCK'
  | 'PAYMENT'
  | 'CREDIT'
  | 'REPORT_READY'
  | 'TEAM'
  | 'SYNC'
  | 'SYSTEM';

export interface Notification {
  id: string;
  businessId: string;
  category: NotificationCategory;
  title: string;
  body: string;
  isRead: boolean;
  deepLink?: string;   // e.g. "vepari://inventory/product/xyz"
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const store = new Map<string, Notification[]>();

function getList(businessId: string): Notification[] {
  if (!store.has(businessId)) store.set(businessId, []);
  return store.get(businessId)!;
}

@Injectable()
export class NotificationsService {
  create(businessId: string, input: Omit<Notification, 'id' | 'businessId' | 'isRead' | 'createdAt'>): Notification {
    const notif: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      businessId,
      isRead: false,
      createdAt: new Date(),
      ...input,
    };
    getList(businessId).unshift(notif);
    // Keep at most 200 notifications per business
    const list = getList(businessId);
    if (list.length > 200) list.splice(200);
    return notif;
  }

  list(businessId: string, unreadOnly = false): Notification[] {
    const list = getList(businessId);
    return unreadOnly ? list.filter(n => !n.isRead) : list;
  }

  markRead(businessId: string, notificationId: string): boolean {
    const notif = getList(businessId).find(n => n.id === notificationId);
    if (!notif) return false;
    notif.isRead = true;
    return true;
  }

  markAllRead(businessId: string): number {
    let count = 0;
    for (const n of getList(businessId)) {
      if (!n.isRead) { n.isRead = true; count++; }
    }
    return count;
  }

  dismiss(businessId: string, notificationId: string): boolean {
    const list = getList(businessId);
    const idx = list.findIndex(n => n.id === notificationId);
    if (idx === -1) return false;
    list.splice(idx, 1);
    return true;
  }

  unreadCount(businessId: string): number {
    return getList(businessId).filter(n => !n.isRead).length;
  }
}
