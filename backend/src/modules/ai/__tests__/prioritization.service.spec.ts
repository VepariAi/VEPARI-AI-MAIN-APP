// Unit tests for prioritization logic — PROMPT 136.
//
// Acceptance criterion: given a synthetic event set with mixed severities,
// the output ordering MUST match Critical → Important → Actionable → Informational exactly.

import { prioritize, groupByPriority, isPrioritized } from '../prioritization.service';
import type { PrioritizableEvent } from '../prioritization.service';

// Synthetic event set with all four priorities mixed in random order
const MIXED_EVENTS: PrioritizableEvent[] = [
  { priority: 'informational', title: 'Sale recorded' },
  { priority: 'critical', title: 'Stock-out: Salt' },
  { priority: 'actionable', title: 'Low stock: Sugar' },
  { priority: 'important', title: 'New customer: Ravi' },
  { priority: 'informational', title: 'Expense logged' },
  { priority: 'critical', title: 'Cash outflow alert' },
  { priority: 'important', title: 'Large sale: ₹5 000' },
  { priority: 'actionable', title: 'Follow up with new customers' },
];

describe('prioritize()', () => {
  it('returns events in Critical → Important → Actionable → Informational order', () => {
    const result = prioritize(MIXED_EVENTS);

    expect(result[0]?.priority).toBe('critical');
    expect(result[1]?.priority).toBe('critical');
    expect(result[2]?.priority).toBe('important');
    expect(result[3]?.priority).toBe('important');
    expect(result[4]?.priority).toBe('actionable');
    expect(result[5]?.priority).toBe('actionable');
    expect(result[6]?.priority).toBe('informational');
    expect(result[7]?.priority).toBe('informational');
  });

  it('does not mutate the input array', () => {
    const input: PrioritizableEvent[] = [
      { priority: 'informational', title: 'A' },
      { priority: 'critical', title: 'B' },
    ];
    const copy = [...input];
    prioritize(input);
    expect(input).toEqual(copy);
  });

  it('preserves relative order within the same priority tier (stable sort)', () => {
    const events: PrioritizableEvent[] = [
      { priority: 'important', id: 1 },
      { priority: 'important', id: 2 },
      { priority: 'important', id: 3 },
    ];
    const result = prioritize(events);
    expect(result.map(e => e['id'])).toEqual([1, 2, 3]);
  });

  it('handles a single-element list', () => {
    const events: PrioritizableEvent[] = [{ priority: 'critical', msg: 'x' }];
    expect(prioritize(events)).toHaveLength(1);
    expect(prioritize(events)[0]?.priority).toBe('critical');
  });

  it('handles an empty list', () => {
    expect(prioritize([])).toEqual([]);
  });

  it('all four priority tiers are represented in the sorted output (from mixed set)', () => {
    const result = prioritize(MIXED_EVENTS);
    const priorities = result.map(e => e.priority);
    expect(priorities).toContain('critical');
    expect(priorities).toContain('important');
    expect(priorities).toContain('actionable');
    expect(priorities).toContain('informational');
  });
});

describe('isPrioritized()', () => {
  it('returns true for an already-sorted list', () => {
    const sorted = prioritize(MIXED_EVENTS);
    expect(isPrioritized(sorted)).toBe(true);
  });

  it('returns false for the unsorted mixed set', () => {
    // Mixed set starts with informational — fails check against next critical
    expect(isPrioritized(MIXED_EVENTS)).toBe(false);
  });

  it('returns true for an empty list', () => {
    expect(isPrioritized([])).toBe(true);
  });

  it('returns true for a single-element list', () => {
    expect(isPrioritized([{ priority: 'critical' }])).toBe(true);
  });
});

describe('groupByPriority()', () => {
  it('groups all events into the correct buckets', () => {
    const groups = groupByPriority(MIXED_EVENTS);

    expect(groups.critical).toHaveLength(2);
    expect(groups.important).toHaveLength(2);
    expect(groups.actionable).toHaveLength(2);
    expect(groups.informational).toHaveLength(2);
  });

  it('each group contains only events of the matching priority', () => {
    const groups = groupByPriority(MIXED_EVENTS);
    for (const [tier, events] of Object.entries(groups)) {
      for (const ev of events) {
        expect(ev.priority).toBe(tier);
      }
    }
  });

  it('returns empty arrays for missing tiers', () => {
    const events: PrioritizableEvent[] = [{ priority: 'critical', x: 1 }];
    const groups = groupByPriority(events);
    expect(groups.important).toHaveLength(0);
    expect(groups.actionable).toHaveLength(0);
    expect(groups.informational).toHaveLength(0);
  });
});
