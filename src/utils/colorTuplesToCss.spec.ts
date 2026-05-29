import { describe, expect, it } from 'vitest';
import { colorTuplesToCss } from './colorTuplesToCss';

describe('colorTuplesToCss', () => {
  it('maps RGB tuples to hex strings', () => {
    expect(
      colorTuplesToCss([
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ]),
    ).toEqual(['#ff0000', '#00ff00', '#0000ff']);
  });

  it('returns an empty array for an empty input', () => {
    expect(colorTuplesToCss([])).toEqual([]);
  });
});
