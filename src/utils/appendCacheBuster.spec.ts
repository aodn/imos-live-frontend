import { describe, expect, it } from 'vitest';
import { appendCacheBuster } from './appendCacheBuster';

describe('appendCacheBuster', () => {
  it('uses ? when the URL has no query string', () => {
    expect(appendCacheBuster('https://example.com/a')).toMatch(
      /^https:\/\/example\.com\/a\?_=\d+_[a-z0-9]+$/,
    );
  });

  it('uses & when the URL already has a query string', () => {
    expect(appendCacheBuster('https://example.com/a?foo=1')).toMatch(
      /^https:\/\/example\.com\/a\?foo=1&_=\d+_[a-z0-9]+$/,
    );
  });

  it('produces different busters on subsequent calls', () => {
    // Even at the same millisecond the random suffix should diverge.
    const a = appendCacheBuster('https://example.com/');
    const b = appendCacheBuster('https://example.com/');
    expect(a).not.toBe(b);
  });

  it('preserves the original path', () => {
    expect(appendCacheBuster('/data/gsla.png')).toMatch(/^\/data\/gsla\.png\?/);
  });
});
