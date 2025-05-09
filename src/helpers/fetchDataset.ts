import { addOrUpdateImageSource } from "@/helpers/addOrUpdateImageSource.ts";
import { addOrUpdateGeoJsonSource } from "@/helpers/addOrUpdateGeoJsonSource.ts";
import {
  GSLAMETANAME,
  GSLAPARTICLENAME,
  GSLASEALEVELNAME,
  OVERLAY_SOURCE_ID,
  PARTICLE_SOURCE_ID,
  WAVE_BUOYS_SOURCE_ID,
} from "@/constants";
import { buildDatasetUrl, loadMetaDataFromUrl } from "@/utils";
import { VectoryLayerInterface } from "@/layers";
import React from "react";

export async function fetchDataset(
  dataset: string,
  map: mapboxgl.Map,
  particleLayer: React.RefObject<VectoryLayerInterface | null>,
) {
  const { maxBounds, bounds, lonRange, latRange, uRange, vRange } =
    await loadMetaDataFromUrl(buildDatasetUrl(dataset, GSLAMETANAME));

  map.setMaxBounds(maxBounds);
  particleLayer.current!.metadata = {
    bounds,
    range: [uRange, vRange],
  };
  addOrUpdateImageSource(
    map,
    PARTICLE_SOURCE_ID,
    buildDatasetUrl(dataset, GSLAPARTICLENAME),
    lonRange,
    latRange,
  );
  addOrUpdateImageSource(
    map,
    OVERLAY_SOURCE_ID,
    buildDatasetUrl(dataset, GSLASEALEVELNAME),
    lonRange,
    latRange,
  );
  addOrUpdateGeoJsonSource(map, WAVE_BUOYS_SOURCE_ID, "/wave_buoys.geojson");
}
