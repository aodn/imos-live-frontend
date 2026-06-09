import { describe, expect, it } from 'vitest';
import { checkDateDuration } from './checkDateDuration';

describe('checkDateDuration', () => {
  it('returns false/false for same day', () => {
    const d = new Date('2026-05-29');
    expect(checkDateDuration(d, d)).toEqual({ moreThanOneMonth: false, moreThanOneYear: false });
  });

  it('returns false/false for under one month', () => {
    expect(checkDateDuration(new Date('2026-05-01'), new Date('2026-05-29'))).toEqual({
      moreThanOneMonth: false,
      moreThanOneYear: false,
    });
  });

  it('returns true/false at exactly one month + same day-of-month', () => {
    expect(checkDateDuration(new Date('2026-01-15'), new Date('2026-02-15'))).toEqual({
      moreThanOneMonth: true,
      moreThanOneYear: false,
    });
  });

  it('returns false/false when month diff = 1 but day rolls back', () => {
    expect(checkDateDuration(new Date('2026-01-20'), new Date('2026-02-10'))).toEqual({
      moreThanOneMonth: false,
      moreThanOneYear: false,
    });
  });

  it('returns true/true at exactly one year + same day', () => {
    expect(checkDateDuration(new Date('2025-05-29'), new Date('2026-05-29'))).toEqual({
      moreThanOneMonth: true,
      moreThanOneYear: true,
    });
  });

  it('returns true/false when one year apart but day-of-month rolls back', () => {
    expect(checkDateDuration(new Date('2025-05-29'), new Date('2026-05-15'))).toEqual({
      moreThanOneMonth: true,
      moreThanOneYear: false,
    });
  });

  it('swaps start/end when reversed', () => {
    expect(checkDateDuration(new Date('2026-05-29'), new Date('2025-05-29'))).toEqual({
      moreThanOneMonth: true,
      moreThanOneYear: true,
    });
  });
});
