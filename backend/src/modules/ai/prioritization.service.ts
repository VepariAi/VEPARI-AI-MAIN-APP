// "While you were away" prioritization logic — PROMPT 136.
//
// Acceptance criterion: given a synthetic event set with mixed severities,
// the output ordering MUST match Critical → Important → Actionable → Informational exactly.
//
// The prioritizer is intentionally decoupled from BriefingService so it can
// be used by any event source (briefing, notifications, alerts) and tested
// with arbitrary synthetic event sets.

export type EventPriority = 'critical' | 'important' | 'actionable' | 'informational';

export interface PrioritizableEvent {
  priority: EventPriority;
  [key: string]: unknown;
}

// Priority tier → sort key (lower = higher priority)
const PRIORITY_RANK: Record<EventPriority, number> = {
  critical: 0,
  important: 1,
  actionable: 2,
  informational: 3,
};

/**
 * Sorts events by priority tier (Critical first, Informational last).
 * Stable sort: events with equal priority keep their original relative order.
 * Returns a new array — does not mutate the input.
 */
export function prioritize<T extends PrioritizableEvent>(events: T[]): T[] {
  return [...events].sort(
    (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority],
  );
}

/**
 * Groups events by priority tier.
 */
export function groupByPriority<T extends PrioritizableEvent>(
  events: T[],
): Record<EventPriority, T[]> {
  const groups: Record<EventPriority, T[]> = {
    critical: [],
    important: [],
    actionable: [],
    informational: [],
  };
  for (const event of events) {
    groups[event.priority].push(event);
  }
  return groups;
}

/**
 * Returns true iff the events array is in non-decreasing priority order
 * (i.e. no lower-priority item appears before a higher-priority one).
 */
export function isPrioritized(events: PrioritizableEvent[]): boolean {
  for (let i = 0; i < events.length - 1; i++) {
    const a = PRIORITY_RANK[events[i]!.priority];
    const b = PRIORITY_RANK[events[i + 1]!.priority];
    if (a > b) return false;
  }
  return true;
}
