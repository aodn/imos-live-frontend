/**
 * Typed URL-state encoder. Each persisted value is tagged with a one-char
 * type prefix so the round-trip is lossless regardless of the underlying
 * JavaScript value.
 *
 *   string   → `s:<value>`
 *   number   → `n:<value>`
 *   boolean  → `b:1` | `b:0`
 *   object   → `j:<json>`   (covers null, arrays, plain objects)
 *
 * Decoding accepts the tagged form *and* the legacy heuristic format
 * (boolean as bare `1`/`0`, number as bare digits, object/array as bare
 * JSON, anything else as a bare string) so existing bookmarked URLs keep
 * working. New writes always emit the tagged form.
 */

type Encoded = string;

const TYPE_TAG_PREFIX = /^([snbj]):(.*)$/s;

export function serialize(value: unknown): Encoded {
  if (typeof value === 'string') return `s:${value}`;
  if (typeof value === 'number') return `n:${value}`;
  if (typeof value === 'boolean') return `b:${value ? '1' : '0'}`;
  // Covers null, arrays, plain objects. `undefined` deliberately not supported
  // — Zustand's persist pipeline never emits it for our partialised state.
  return `j:${JSON.stringify(value)}`;
}

export function deserialize(encoded: Encoded): unknown {
  // Tagged form (new writes)
  const match = TYPE_TAG_PREFIX.exec(encoded);
  if (match) {
    const [, tag, payload] = match;
    switch (tag) {
      case 's':
        return payload;
      case 'n': {
        const n = Number(payload);
        return Number.isNaN(n) ? payload : n;
      }
      case 'b':
        return payload === '1';
      case 'j':
        try {
          return JSON.parse(payload);
        } catch {
          return payload;
        }
    }
  }

  // Legacy form (old URLs, written before the typed scheme)
  if (encoded === '1') return true;
  if (encoded === '0') return false;
  if (/^-?\d+(\.\d+)?$/.test(encoded.trim())) return Number(encoded);
  if (encoded.startsWith('{') || encoded.startsWith('[')) {
    try {
      return JSON.parse(encoded);
    } catch {
      return encoded;
    }
  }
  return encoded;
}
