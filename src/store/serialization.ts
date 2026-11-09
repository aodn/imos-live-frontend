/**
 * URL-state codec
 *
 *   center         → `<lng>*<lat>`            e.g. `133.775*-25.274` (3 dp, truncated)
 *   zoom           → `<number>`               e.g. `3.172` (3 dp, truncated)
 *   style / date   → `<string>`               e.g. `Streets`, `2026-05-31`
 *   *Enabled flags → `1` | `0`
 *   particleConfig → `<n1>*<n2>*…`            values in `PARTICLE_FIELDS` order
 *   productEnabled → `1101…`                  one bit per product, `PRODUCT` order
 *
 * `*` is the structural separator because `URLSearchParams` leaves only
 * `* - . _` and alphanumerics un-escaped, and our values already use `-`/`.`/`_`.
 */
import { INITIAL_PARTICLE_CONFIG, PRODUCT } from '@/constants';
import type { ParticleConfig } from '@/AtlasRenderingSystem';

type Encoded = string;
type KeyCodec = {
  encode: (value: unknown) => Encoded;
  decode: (encoded: Encoded) => unknown;
};

const LIST_SEP = '*';

// Field order for `particleConfig` — values are emitted/read positionally.
const PARTICLE_FIELDS = Object.keys(INITIAL_PARTICLE_CONFIG) as (keyof ParticleConfig)[];

// Stable product order for the `productEnabled` bit string. Encode and decode
// share this array, so the round-trip is order-independent by construction.
const PRODUCT_ORDER = Object.values(PRODUCT);

// Map position in the URL is truncated to 3 decimal places (~100 m for
// lng/lat), which keeps links short without a noticeable shift on restore.
const URL_DECIMALS = 3;
const URL_SCALE = 10 ** URL_DECIMALS;

// Truncate (not round) to URL_DECIMALS. The intermediate `toFixed` absorbs
// float error so e.g. 1.005 stays 1.005 instead of becoming 1.004.
function truncateDecimals(n: number): string {
  return String(Math.trunc(Number((n * URL_SCALE).toFixed(6))) / URL_SCALE);
}

const strCodec: KeyCodec = { encode: v => String(v), decode: s => s };
const boolCodec: KeyCodec = { encode: v => (v ? '1' : '0'), decode: s => s === '1' };
const zoomCodec: KeyCodec = { encode: v => truncateDecimals(v as number), decode: s => Number(s) };

const centerCodec: KeyCodec = {
  encode: v => {
    const c = v as { lng: number; lat: number };
    return `${truncateDecimals(c.lng)}${LIST_SEP}${truncateDecimals(c.lat)}`;
  },
  decode: s => {
    const [lng, lat] = s.split(LIST_SEP);
    return { lng: Number(lng), lat: Number(lat) };
  },
};

const particleCodec: KeyCodec = {
  encode: v => {
    const config = v as ParticleConfig;
    return PARTICLE_FIELDS.map(field => config[field]).join(LIST_SEP);
  },
  decode: s => {
    const parts = s.split(LIST_SEP);
    const config: ParticleConfig = {} as ParticleConfig;
    PARTICLE_FIELDS.forEach((field, i) => {
      config[field] = Number(parts[i]);
    });
    return config;
  },
};

const productEnabledCodec: KeyCodec = {
  encode: v => {
    const enabled = v as Record<string, boolean>;
    return PRODUCT_ORDER.map(product => (enabled[product] ? '1' : '0')).join('');
  },
  decode: s => {
    const enabled: Record<string, boolean> = {};
    PRODUCT_ORDER.forEach((product, i) => {
      enabled[product] = s[i] === '1';
    });
    return enabled;
  },
};

const KEY_CODECS: Record<string, KeyCodec> = {
  center: centerCodec,
  zoom: zoomCodec,
  style: strCodec,
  date: strCodec,
  worldBoundariesEnabled: boolCodec,
  particleConfig: particleCodec,
  productEnabled: productEnabledCodec,
};

export function serialize(value: unknown, key?: string): Encoded {
  const codec = key === undefined ? undefined : KEY_CODECS[key];
  return codec ? codec.encode(value) : String(value);
}

export function deserialize(encoded: Encoded, key?: string): unknown {
  const codec = key === undefined ? undefined : KEY_CODECS[key];
  return codec ? codec.decode(encoded) : encoded;
}
