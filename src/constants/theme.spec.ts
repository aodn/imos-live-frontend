import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { THEME_COLORS } from './theme';

const css = readFileSync(resolve(__dirname, '../index.css'), 'utf8');
const toKebab = (s: string) => s.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`);

describe('THEME_COLORS', () => {
  it.each(Object.entries(THEME_COLORS))(
    '%s matches the @theme token in index.css',
    (key, value) => {
      const match = css.match(new RegExp(`--color-${toKebab(key)}:\\s*(#[0-9a-fA-F]{3,8})\\s*;`));
      expect(match?.[1].toLowerCase()).toBe(value);
    },
  );
});
