import type { Point } from 'geojson';

// Site List same for buoy and moorings.
// geojson's Point allows any-length `Position`; wave buoy points are always [lng, lat].
export type SitePoint = Point & { coordinates: [number, number] };

// Shape as returned by the API — no synthetic `_id` yet.
export type RawSiteProperties = {
  date: string;
  //Temporary allow both buoy and site, but eventually only allow site. This needs serverside fixing.
  buoy?: string;
  site?: string;
};
// After `addIdToFeatures` injects the synthetic `_id` used for Mapbox feature-state / clustering.
export type SiteProperties = RawSiteProperties & { _id: string };

export type RawSiteFeature = {
  type: 'Feature';
  properties: RawSiteProperties;
  geometry: SitePoint;
};
export type RawSiteFeatureCollection = {
  type: 'FeatureCollection';
  features: RawSiteFeature[];
};

export type SiteFeature = {
  type: 'Feature';
  properties: SiteProperties;
  geometry: SitePoint;
};
export type SiteFeatureCollection = {
  type: 'FeatureCollection';
  features: SiteFeature[];
};

// Site Details
export type SiteDetailsFeature<T> = {
  type: 'Feature';
  properties: T;
  geometry: SitePoint;
};
export type SiteItemContent = [number, number][];
export type BuoyDataVariants = 'SSWMD' | 'WPFM' | 'WSSH' | 'WHTH' | 'WPMH';
export type BuoyItem = Record<BuoyDataVariants, SiteItemContent>;
export type WaveBuoySiteDetailsFeatureCollection = {
  type: 'FeatureCollection';
  features: SiteDetailsFeature<BuoyItem>[];
};

export type NominalDepthVariant = `NOMINAL_DEPTH_${number}`;
export type MooringDataVariants = 'TEMP';
export type MooringItemContent = Record<MooringDataVariants, SiteItemContent>;
export type MooringItem = Record<NominalDepthVariant, MooringItemContent>;
export type MooringSiteDetailsFeatureCollection = {
  type: 'FeatureCollection';
  features: SiteDetailsFeature<MooringItem>[];
};
