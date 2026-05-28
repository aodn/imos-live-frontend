import { describe, expect, it } from 'vitest';
import { deserialize, serialize } from './serialization';

describe('serialize/deserialize round-trip', () => {
  const cases: { name: string; value: unknown }[] = [
    { name: 'string', value: 'Streets' },
    { name: 'date string', value: '2026-05-28' },
    { name: 'string that looks like a number', value: '3' },
    { name: 'string that looks like a negative number', value: '-1.5' },
    { name: 'string "0"', value: '0' },
    { name: 'string "1"', value: '1' },
    { name: 'string starting with {', value: '{not json' },
    { name: 'empty string', value: '' },
    { name: 'integer', value: 3 },
    { name: 'negative float', value: -1.25 },
    { name: 'zero', value: 0 },
    { name: 'boolean true', value: true },
    { name: 'boolean false', value: false },
    { name: 'object', value: { lng: 133.7751, lat: -25.2744 } },
    { name: 'array', value: [1, 2, 3] },
    { name: 'nested object', value: { a: { b: [1, 'two', true] } } },
    { name: 'null', value: null },
  ];

  for (const { name, value } of cases) {
    it(`preserves ${name}`, () => {
      expect(deserialize(serialize(value))).toEqual(value);
    });
  }
});

describe('legacy URL fallback', () => {
  it('decodes bare "1" as boolean true', () => {
    expect(deserialize('1')).toBe(true);
  });

  it('decodes bare "0" as boolean false', () => {
    expect(deserialize('0')).toBe(false);
  });

  it('decodes bare digits as a number', () => {
    expect(deserialize('42')).toBe(42);
    expect(deserialize('-1.5')).toBe(-1.5);
  });

  it('decodes bare JSON object as object', () => {
    expect(deserialize('{"lng":1,"lat":2}')).toEqual({ lng: 1, lat: 2 });
  });

  it('decodes other bare values as strings', () => {
    expect(deserialize('Streets')).toBe('Streets');
    expect(deserialize('2026-05-28')).toBe('2026-05-28');
  });
});

describe('typed encoding format', () => {
  it('tags strings with s:', () => {
    expect(serialize('Streets')).toBe('s:Streets');
  });

  it('tags numbers with n:', () => {
    expect(serialize(3)).toBe('n:3');
  });

  it('tags booleans with b:', () => {
    expect(serialize(true)).toBe('b:1');
    expect(serialize(false)).toBe('b:0');
  });

  it('tags objects with j:', () => {
    expect(serialize({ a: 1 })).toBe('j:{"a":1}');
  });

  it('survives malformed j: payload by returning the raw payload', () => {
    expect(deserialize('j:not-json')).toBe('not-json');
  });
});
