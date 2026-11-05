import type { EstuarineMooringItem, MooringItem, MooringItemContent } from '@/types';

const DEPTH_PREFIX = 'NOMINAL_DEPTH_';
const INSTRUMENT_PREFIX = 'instrument_';

// One measuring position on a mooring: a depth and, where the API reports it, the instrument.
export type MooringChannel = {
  depth: number;
  instrument?: string;
  variables: MooringItemContent;
};

function byDepthThenInstrument(a: MooringChannel, b: MooringChannel): number {
  return a.depth - b.depth || (a.instrument ?? '').localeCompare(b.instrument ?? '');
}

function depthChannels(item: MooringItem, instrument?: string): MooringChannel[] {
  return Object.entries(item)
    .filter(([key]) => key.startsWith(DEPTH_PREFIX))
    .map(([key, variables]) => ({
      depth: Number(key.slice(DEPTH_PREFIX.length)),
      instrument,
      variables,
    }));
}

// Flattens either response shape into one list, shallowest first:
// - mooring timeseries: { NOMINAL_DEPTH_x: variables }
// - estuarine: { instrument_y: { NOMINAL_DEPTH_x: variables } }
export function toMooringChannels(
  properties?: MooringItem | EstuarineMooringItem | null,
): MooringChannel[] {
  const entries = Object.entries(properties ?? {});
  const instrumentEntries = entries.filter(([key]) => key.startsWith(INSTRUMENT_PREFIX));
  const channels = [
    ...depthChannels((properties ?? {}) as MooringItem),
    ...instrumentEntries.flatMap(([key, item]) =>
      depthChannels(item as MooringItem, key.slice(INSTRUMENT_PREFIX.length)),
    ),
  ];
  return channels.sort(byDepthThenInstrument);
}
