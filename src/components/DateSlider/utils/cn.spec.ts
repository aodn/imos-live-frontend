import { describe, expect, it } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('joins string class names with spaces', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('omits falsy values', () => {
    expect(cn('a', false, null, undefined, '', 'b')).toBe('a b');
  });

  it('applies conditional object syntax (clsx)', () => {
    expect(cn('base', { active: true, disabled: false })).toBe('base active');
  });

  it('flattens nested arrays', () => {
    expect(cn(['a', ['b', 'c']], 'd')).toBe('a b c d');
  });

  it('returns an empty string when given nothing', () => {
    expect(cn()).toBe('');
  });

  it('lets later tailwind utilities override earlier ones in the same class group', () => {
    // tailwind-merge: later wins for conflicting utilities.
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('keeps non-conflicting tailwind classes together', () => {
    const result = cn('text-sm', 'font-bold', 'bg-white');
    expect(result.split(' ').sort()).toEqual(['bg-white', 'font-bold', 'text-sm']);
  });

  it('treats custom font-size tokens as a single conflict group', () => {
    // The cn util extends tailwind-merge with custom font-size tokens like
    // text-body, text-btn, text-title-* — only one should survive.
    expect(cn('text-body', 'text-btn')).toBe('text-btn');
    expect(cn('text-title-sm', 'text-title-lg')).toBe('text-title-lg');
  });
});
