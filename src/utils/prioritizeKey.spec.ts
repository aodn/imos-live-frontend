import { describe, expect, it } from 'vitest';
import { prioritizeKey } from './prioritizeKey';

describe('prioritizeKey', () => {
  it('moves matching items to the front', () => {
    const input = [
      { id: 1, type: 'b' },
      { id: 2, type: 'a' },
      { id: 3, type: 'b' },
      { id: 4, type: 'a' },
    ];
    const result = prioritizeKey(input, 'type', 'a');
    expect(result.map(r => r.id)).toEqual([2, 4, 1, 3]);
  });

  it('preserves relative order within each group (stable sort behaviour)', () => {
    const input = [
      { id: 1, role: 'admin' },
      { id: 2, role: 'user' },
      { id: 3, role: 'admin' },
      { id: 4, role: 'user' },
    ];
    const result = prioritizeKey(input, 'role', 'admin');
    expect(result.map(r => r.id)).toEqual([1, 3, 2, 4]);
  });

  it('returns a new array (does not mutate input)', () => {
    const input = [{ x: 1 }, { x: 2 }];
    const original = [...input];
    prioritizeKey(input, 'x', 2);
    expect(input).toEqual(original);
  });

  it('returns input order when no items match', () => {
    const input = [{ a: 1 }, { a: 2 }];
    expect(prioritizeKey(input, 'a', 99)).toEqual(input);
  });
});
