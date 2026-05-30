/**
 * Single source of truth for product identities — slugs, layer IDs, source IDs,
 * and the variables each product carries. Legend metadata for each product
 * lives in `./legends`; palette data lives in `./colors`.
 */

export const PRODUCT = {
  GSLA_OCEAN_GEOSTROPHIC_CURRENT: 'model_sea_level_anomaly_gridded_realtime_vcur_ucur',
  GSLA_ANOMALY_SEA_LEVELS: 'model_sea_level_anomaly_gridded_realtime_gsla',
  AUSTEMP_HEATWAVE_SSTA_MOSAIC: 'satellite_austemp_heatwave_8day_ssta_mosaic',
  AUSTEMP_HEATWAVE_SST_MOSAIC: 'satellite_austemp_heatwave_8day_sst_mosaic',
  AUSTEMP_HEATWAVE_MCS_CATEGORY: 'satellite_austemp_heatwave_8day_mcs_category',
  WAVE_BUOYS: 'wave-buoys',
} as const;

export type ProductType = (typeof PRODUCT)[keyof typeof PRODUCT];

export type TilesProduct = Exclude<ProductType, typeof PRODUCT.WAVE_BUOYS>;

type ProductValue = {
  name: string;
  layerId: string;
  sourceId: string;
  variables?: string[];
  /** User-facing description shown on the product card in the sidebar. */
  description: string;
  /** External AODN portal/catalogue link for "More details". */
  portalLink: string;
};

const AUSTEMP_HEATWAVE_PORTAL_LINK =
  'https://catalogue-imos.aodn.org.au/geonetwork/srv/eng/catalog.search#/search?any=IMOS%20-%20AusTemp%20-%20Marine%20Heatwave';
const GSLA_PORTAL_LINK =
  'https://portal-beta.aodn.org.au/details/0c9eb39c-9cbe-4c6a-8a10-5867087e703a';

export const PRODUCTS = {
  [PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT]: {
    name: 'GSLA Ocean Geostrophic Current',
    layerId: 'gsla-particle-layer',
    sourceId: 'gsla-particle-source',
    variables: ['UCUR', 'VCUR'],
    description:
      'Gridded sea level (GSL) and surface geostrophic velocity (UCUR,VCUR) for the Australasian region.' +
      ' GSLA is mapped using optimal interpolation of detided, de-meaned, inverse-barometer-adjusted altimeter' +
      ' and tidegauge estimates of sea level. GSL is GSLA plus an estimate of the departure of mean sea level from the geoid.' +
      ' The geostrophic velocities are derived from GSL.',
    portalLink: GSLA_PORTAL_LINK,
  },
  [PRODUCT.GSLA_ANOMALY_SEA_LEVELS]: {
    name: 'GSLA Anomaly Sea Levels',
    layerId: 'gsla-raster-layer',
    sourceId: 'gsla-raster-source',
    variables: ['GSLA'],
    description:
      'Gridded (adjusted) sea level anomaly (GSLA)' +
      ' for the Australasian region.' +
      ' GSLA is mapped using optimal interpolation of detided, de-meaned, inverse-barometer-adjusted altimeter' +
      ' and tidegauge estimates of sea level. GSL is GSLA plus an estimate of the departure of mean sea level from the geoid.' +
      ' The geostrophic velocities are derived from GSL.',
    portalLink: GSLA_PORTAL_LINK,
  },
  [PRODUCT.WAVE_BUOYS]: {
    name: 'Wave Buoys',
    layerId: 'wave-buoys-layer',
    sourceId: 'wave-buoys-source',
    description:
      'Buoys provide integral wave parameters. Buoy data from the following organisations contribute to the National Wave Archive: Manly Hydraulics Laboratory, Bureau of Meteorology, DOT, DES, IMOS, Gippsland Ports, DPE, UWA, Deakin University, Pilbara Ports Authority and Flinders University and SARDI.',
    portalLink: 'https://portal-beta.aodn.org.au/details/b299cdcd-3dee-48aa-abdd-e0fcdbb9cadc',
  },
  [PRODUCT.AUSTEMP_HEATWAVE_SST_MOSAIC]: {
    name: 'Austemp heatwave SST Mosaic',
    layerId: 'austemp-heatwave-sst-mosaic-layer',
    sourceId: 'austemp-heatwave-sst-mosaic-source',
    variables: ['sst_mosaic'],
    description:
      'Sea Surface Temperature (SST) mosaic for the Australasian region, showing absolute sea surface temperatures used to identify marine heatwave conditions.',
    portalLink: AUSTEMP_HEATWAVE_PORTAL_LINK,
  },
  [PRODUCT.AUSTEMP_HEATWAVE_SSTA_MOSAIC]: {
    name: 'Austemp heatwave SSTA Mosaic',
    layerId: 'austemp-heatwave-ssta-mosaic-layer',
    sourceId: 'austemp-heatwave-ssta-mosaic-source',
    variables: ['ssta_mosaic'],
    description:
      'Sea Surface Temperature Anomaly (SSTA) mosaic for the Australasian region, showing deviations from the long-term mean to identify marine heatwave conditions.',
    portalLink: AUSTEMP_HEATWAVE_PORTAL_LINK,
  },
  [PRODUCT.AUSTEMP_HEATWAVE_MCS_CATEGORY]: {
    name: 'Austemp heatwave MCS Category',
    layerId: 'austemp-heatwave-mcs-category-layer',
    sourceId: 'austemp-heatwave-mcs-category-source',
    variables: ['MCS_category'],
    description:
      'Marine Cold Spell / Marine Heatwave (MCS) category mosaic for the Australasian region, classifying sea surface temperature anomalies into severity categories.',
    portalLink: AUSTEMP_HEATWAVE_PORTAL_LINK,
  },
} as const satisfies Record<ProductType, ProductValue>;

export const MAX_VECTOR_SPEED = 3.0 as const;

export type ProductName = (typeof PRODUCTS)[ProductType]['name'];
export type BuoyLayer = (typeof PRODUCTS)[typeof PRODUCT.WAVE_BUOYS]['layerId'];
export type BuoySource = (typeof PRODUCTS)[typeof PRODUCT.WAVE_BUOYS]['sourceId'];

export const TILES_GROUP = [
  PRODUCT.GSLA_ANOMALY_SEA_LEVELS,
  PRODUCT.AUSTEMP_HEATWAVE_SST_MOSAIC,
  PRODUCT.AUSTEMP_HEATWAVE_SSTA_MOSAIC,
  PRODUCT.AUSTEMP_HEATWAVE_MCS_CATEGORY,
] as const satisfies TilesProduct[];
