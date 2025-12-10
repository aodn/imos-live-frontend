import { LngLat } from 'mapbox-gl';

// URL-safe prefix for LngLat
const LNGLAT_PREFIX = 'lnglat';

//replace ':' with '_',  ',' with '~', because - and ~ are url safe, they will not be conveted to text like '%22%3A' in url.

export const serialize = (value: any): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? '1' : '0';

  if (value && typeof value === 'object' && 'lng' in value && 'lat' in value) {
    return `${LNGLAT_PREFIX}${value.lng}~${value.lat}`;
  }

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value)
      .map(([k, v]) => `${k}_${v}`)
      .join('~');
  }

  return JSON.stringify(value);
};

export const deserialize = (value: string): any => {
  if (value === '1') return true;
  if (value === '0') return false;

  if (value.startsWith(LNGLAT_PREFIX)) {
    const coords = value.slice(LNGLAT_PREFIX.length);
    const [lng, lat] = coords.split('~').map(Number);
    return new LngLat(lng, lat);
  }

  if (/^-?\d+(\.\d+)?$/.test(value.trim())) {
    return Number(value);
  }

  //include _ ~ is include :,, means this is object.
  if (value.includes('_') && value.includes('~')) {
    const obj: Record<string, any> = {};
    value.split('~').forEach(pair => {
      const firstUnderscore = pair.indexOf('_');
      const k = pair.slice(0, firstUnderscore);
      const v = pair.slice(firstUnderscore + 1);

      if (v === 'true') obj[k] = true;
      else if (v === 'false') obj[k] = false;
      else if (/^-?\d+(\.\d+)?$/.test(v)) obj[k] = Number(v);
      else obj[k] = v;
    });
    return obj;
  }

  if (value.startsWith('{') || value.startsWith('[')) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  return value;
};
