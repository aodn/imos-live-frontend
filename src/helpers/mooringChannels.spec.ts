import { describe, expect, it } from 'vitest';
import { toMooringChannels } from './mooringChannels';

const TEMP: [number, number][] = [[1, 18]];
const FLUSI: [number, number][] = [[1, 1.7]];

describe('toMooringChannels', () => {
  it('returns one channel per depth, shallowest first', () => {
    const channels = toMooringChannels({
      'NOMINAL_DEPTH_50.0': { TEMP },
      'NOMINAL_DEPTH_10.0': { TEMP },
    });

    expect(channels).toEqual([
      { depth: 10, instrument: undefined, variables: { TEMP } },
      { depth: 50, instrument: undefined, variables: { TEMP } },
    ]);
  });

  it('returns no channels when properties are missing', () => {
    expect(toMooringChannels(undefined)).toEqual([]);
    expect(toMooringChannels(null)).toEqual([]);
  });
});

describe('toMooringChannels with instruments', () => {
  it('keeps the instruments at one depth as separate channels', () => {
    const channels = toMooringChannels({
      'instrument_HAI-AHIW2A-CAD': { 'NOMINAL_DEPTH_0.9': { TEMP, FLUSI } },
      'instrument_EXO2-SONDE': { 'NOMINAL_DEPTH_0.9': { TEMP } },
    });

    expect(channels).toEqual([
      { depth: 0.9, instrument: 'EXO2-SONDE', variables: { TEMP } },
      { depth: 0.9, instrument: 'HAI-AHIW2A-CAD', variables: { TEMP, FLUSI } },
    ]);
  });

  it('sorts by depth before instrument', () => {
    const channels = toMooringChannels({
      instrument_A: { 'NOMINAL_DEPTH_5.0': { TEMP } },
      instrument_B: { 'NOMINAL_DEPTH_1.0': { TEMP } },
    });

    expect(channels.map(c => [c.depth, c.instrument])).toEqual([
      [1, 'B'],
      [5, 'A'],
    ]);
  });

  it('returns no channels when properties are missing', () => {
    expect(toMooringChannels(undefined)).toEqual([]);
  });
});
