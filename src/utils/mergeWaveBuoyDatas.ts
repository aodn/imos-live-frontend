import { BuouyItem, WaveBuoyDetailsFeature, WaveBuoyDetailsFeatureCollection } from '@/types';

export function mergeAllParametersData(collections: WaveBuoyDetailsFeatureCollection[]): BuouyItem {
  const fullprops = collections
    .map(c => c.features)
    .flat()
    .map(feat => feat.properties);

  if (fullprops.length === 0) {
    return {
      SSWMD: { data: [] },
      WPFM: { data: [] },
      WSSH: { data: [] },
    };
  }
  return fullprops.reduce((prev, next) => {
    if (next.SSWMD) prev.SSWMD.data = [...prev.SSWMD.data, ...next.SSWMD.data];
    if (next.WPFM) prev.WPFM.data = [...prev.WPFM.data, ...next.WPFM.data];
    if (next.WSSH) prev.WSSH.data = [...prev.WSSH.data, ...next.WSSH.data];
    return prev;
  });
}

export function createMergedCollectionWithAllParameters(
  collections: WaveBuoyDetailsFeatureCollection[],
): WaveBuoyDetailsFeature {
  return {
    type: 'Feature',
    geometry: collections?.[0]?.features?.[0]?.geometry,
    properties: mergeAllParametersData(collections),
  };
}
