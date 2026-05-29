import { describe, expect, it } from 'vitest';
import { pipe } from './pipe';

describe('pipe', () => {
  it('composes functions left-to-right', () => {
    const f = pipe(
      (n: number) => n + 1,
      (n: number) => n * 2,
    );
    // (3 + 1) * 2 = 8
    expect(f(3)).toBe(8);
  });

  it('returns input unchanged with no functions', () => {
    expect(pipe<number>()(7)).toBe(7);
  });

  it('handles a single function', () => {
    expect(pipe((s: string) => s.toUpperCase())('abc')).toBe('ABC');
  });
});
