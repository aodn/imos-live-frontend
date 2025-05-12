type RangeType = [number, number];

type MaxBoundsType = [range: RangeType, range: RangeType];

type BoundsType = [number, number, number, number];

type MetaType = {
  latRange: RangeType;
  lonRange: RangeType;
  uRange: RangeType;
  vRange: RangeType;
};

type ProcessedMetaType = MetaType & {
  bounds: BoundsType;
  maxBounds: MaxBoundsType;
};

export async function loadMetaDataFromUrl(url: string): Promise<ProcessedMetaType> {
  const response = await fetch(url);
  const meta: MetaType = await response.json();
  const { lonRange, latRange, uRange, vRange } = meta;

  //fours lines shape a rectangle, lon x, lat y.
  const bounds: BoundsType = [lonRange[0], latRange[1], lonRange[1], latRange[0]];

  const maxBounds: MaxBoundsType = [
    [lonRange[0], latRange[0]],
    [lonRange[1], latRange[1]],
  ];

  return {
    bounds,
    maxBounds,
    lonRange,
    latRange,
    uRange,
    vRange,
  };
}
