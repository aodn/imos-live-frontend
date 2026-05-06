import type { RasterSource } from '@/constants';
import {
  GSLA_RASTER_SOURCE_ID,
  AUSTEMP_SSTA_MOSAIC_RASTER_SOURCE_ID,
  AUSTEMP_DHD_MOSAIC_RASTER_SOURCE_ID,
  PRODUCT,
  PRODUCTLEGENDS,
  AUSTEMP_SST_MOSAIC_RASTER_SOURCE_ID,
  AUSTEMP_MHW_CATEGORY_MOSAIC_RASTER_SOURCE_ID,
} from '@/constants';
import { getThreddsCatalog } from '@/api';
import { addYears } from '@/utils';

const THREDDS_PATHS = {
  GSLA: 'IMOS/OceanCurrent/GSLA/NRT',
  AUSTEMP_SSTA: 'IMOS/SRS/AusTemp/Marine-Heatwave',
  AUSTEMP_DHD: 'IMOS/SRS/AusTemp/Marine-Heatwave',
  AUSTEMP_SST: 'IMOS/SRS/AusTemp/Marine-Heatwave',
  AUSTEMP_MHW: 'IMOS/SRS/AusTemp/Marine-Heatwave',
} as const;

const FILE_PATTERNS = {
  GSLA: (dateString: string) => `IMOS_OceanCurrent_HV_${dateString}T`,
  AUSTEMP_SSTA: (dateString: string) => `${dateString}_IMOS_AusTemp-marine-heatwave_AUS_fv02.nc`,
  AUSTEMP_DHD: (dateString: string) => `${dateString}_IMOS_AusTemp-marine-heatwave_AUS_fv02.nc`,
  AUSTEMP_SST: (dateString: string) => `${dateString}_IMOS_AusTemp-marine-heatwave_AUS_fv02.nc`,
  AUSTEMP_MHW: (dateString: string) => `${dateString}_IMOS_AusTemp-marine-heatwave_AUS_fv02.nc`,
} as const;

const WMS_CONFIG = {
  [GSLA_RASTER_SOURCE_ID]: {
    layers: 'GSLA',
    colorScaleRange: `${PRODUCTLEGENDS[PRODUCT.GSLA_ANOMALY_SEA_LEVELS].min},${PRODUCTLEGENDS[PRODUCT.GSLA_ANOMALY_SEA_LEVELS].max}`,
    styles: `raster/${PRODUCTLEGENDS[PRODUCT.GSLA_ANOMALY_SEA_LEVELS].colors}`,
    legendPalette: PRODUCTLEGENDS[PRODUCT.GSLA_ANOMALY_SEA_LEVELS].colors,
  },
  [AUSTEMP_SSTA_MOSAIC_RASTER_SOURCE_ID]: {
    layers: 'ssta_mosaic',
    colorScaleRange: `${PRODUCTLEGENDS[PRODUCT.AUSTEMP_SSTA_MOSAIC].min},${PRODUCTLEGENDS[PRODUCT.AUSTEMP_SSTA_MOSAIC].max}`,
    styles: `raster/${PRODUCTLEGENDS[PRODUCT.AUSTEMP_SSTA_MOSAIC].colors}`,
    legendPalette: PRODUCTLEGENDS[PRODUCT.AUSTEMP_SSTA_MOSAIC].colors,
  },
  [AUSTEMP_DHD_MOSAIC_RASTER_SOURCE_ID]: {
    layers: 'dhd_mosaic',
    colorScaleRange: `${PRODUCTLEGENDS[PRODUCT.AUSTEMP_DHD_MOSAIC].min},${PRODUCTLEGENDS[PRODUCT.AUSTEMP_DHD_MOSAIC].max}`,
    styles: `raster/${PRODUCTLEGENDS[PRODUCT.AUSTEMP_DHD_MOSAIC].colors}`,
    legendPalette: PRODUCTLEGENDS[PRODUCT.AUSTEMP_DHD_MOSAIC].colors,
  },
  [AUSTEMP_SST_MOSAIC_RASTER_SOURCE_ID]: {
    layers: 'sst_mosaic',
    colorScaleRange: `${PRODUCTLEGENDS[PRODUCT.AUSTEMP_SST_MOSAIC].min},${PRODUCTLEGENDS[PRODUCT.AUSTEMP_SST_MOSAIC].max}`,
    styles: `raster/${PRODUCTLEGENDS[PRODUCT.AUSTEMP_SST_MOSAIC].colors}`,
    legendPalette: PRODUCTLEGENDS[PRODUCT.AUSTEMP_SST_MOSAIC].colors,
  },
  [AUSTEMP_MHW_CATEGORY_MOSAIC_RASTER_SOURCE_ID]: {
    layers: 'MHW_category_mosaic',
    colorScaleRange: '',
    styles: ``,
    legendPalette: '',
  },
} as const;

const generateFileDateString = (date: Date): string => {
  return `${date.getFullYear()}${(date.getUTCMonth() + 1)
    .toString()
    .padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
};

const generateDoc = async (path: string, date: Date) => {
  const catalog = await getThreddsCatalog(path, date);
  const parser = new DOMParser();
  return parser.parseFromString(catalog, 'text/html');
};

const findLinkInCatalog = (doc: Document, pattern: string): string | null => {
  return (
    Array.from(doc.querySelectorAll('.section-content a[href]'))
      .map(item => (item as HTMLAnchorElement).href)
      .find(link => link.includes(pattern)) || null
  );
};

// GSLA file name pattern example: IMOS_OceanCurrent_HV_20240615T000000Z_NRT.nc or IMOS_OceanCurrent_HV_20240615T180000Z_DAILY.nc,
// so we just need date part to find the link in catalog. and certain year file is expected to be in certain year folder in thredds server.
// Therefore, we can always find certain year's GSLA file in that year's folder catalog.
const getGslaUrlFromCatalog = async (date: Date): Promise<string> => {
  try {
    const doc = await generateDoc(THREDDS_PATHS.GSLA, date);
    const dateString = generateFileDateString(date);
    const link = findLinkInCatalog(doc, FILE_PATTERNS.GSLA(dateString));

    if (link) {
      const url = new URL(link);
      const dataset = url.searchParams.get('dataset');
      if (dataset) {
        return `/thredds/wms/${dataset}`;
      }
    }
  } catch (error) {
    console.error('Error fetching GSLA catalog:', error);
  }
  return `/thredds/wms/invalid_dataset`; //do not throw error here to avoid image loading failure test for legend url
};

// Austemp product file name pattern example: 20240615_IMOS_AusTemp-sst-anomaly_AUS_fv02.nc, but the file may be in next year folder.
const getAusTempUrlFromCatalog = async (date: Date): Promise<string> => {
  const dateString = generateFileDateString(date);
  const pattern = FILE_PATTERNS.AUSTEMP_SSTA(dateString);
  const dates = [date, addYears(date, 1)];

  const results = await Promise.allSettled(
    dates.map(async date => {
      const doc = await generateDoc(THREDDS_PATHS.AUSTEMP_SSTA, date);
      return findLinkInCatalog(doc, pattern);
    }),
  );

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      const url = new URL(result.value);
      const dataset = url.searchParams.get('dataset');
      if (!dataset) continue;
      return `/thredds/wms/${dataset}`;
    }
  }

  return `/thredds/wms/invalid_dataset`; //do not throw error here to avoid image loading failure test for legend url
};

const baseUrl = async (id: RasterSource, date: Date): Promise<string> => {
  switch (id) {
    case GSLA_RASTER_SOURCE_ID:
      return await getGslaUrlFromCatalog(date);
    case AUSTEMP_SSTA_MOSAIC_RASTER_SOURCE_ID:
      return await getAusTempUrlFromCatalog(date);
    case AUSTEMP_DHD_MOSAIC_RASTER_SOURCE_ID:
      return await getAusTempUrlFromCatalog(date);
    case AUSTEMP_SST_MOSAIC_RASTER_SOURCE_ID:
      return await getAusTempUrlFromCatalog(date);
    case AUSTEMP_MHW_CATEGORY_MOSAIC_RASTER_SOURCE_ID:
      return await getAusTempUrlFromCatalog(date);
    default:
      throw new Error(`Unknown raster source: ${id}`);
  }
};

export type RasterDataType = 'categorical' | 'continous';
/**
 *
 * @param id
 * @param date
 * @param type - 'categorical' | 'continous'
 * @returns
 *
 * categorical means the data in the grid dataset is in category. Each data point value can only be like 0,1,2,3,4. We cannot have COLORSCALERANGE and configed styles passed to the WMS service, which is not supported. It only has the default-categorical style.
 * https://reading-escience-centre.gitbooks.io/ncwms-user-guide/content/05-data_formats.html#categorical
 * continous is the normal one, each data point can be any number.
 */
export const rasterUrl = async (
  id: RasterSource,
  date: Date,
  type: RasterDataType = 'continous',
): Promise<string> => {
  const base = await baseUrl(id, date);
  const config = WMS_CONFIG[id];
  // Use /tiles/{z}/{x}/{y} path for CloudFront cache-friendly URLs
  // The proxy will convert z/x/y to bbox before forwarding to THREDDS
  if (type === 'continous')
    return `/tiles/{z}/{x}/{y}${base}?COLORSCALERANGE=${config.colorScaleRange}&version=1.3.0&REQUEST=GetMap&LAYERS=${config.layers}&styles=${config.styles}&crs=EPSG:3857&format=image/png&transparent=true&width=256&height=256`;
  return `/tiles/{z}/{x}/{y}${base}?version=1.3.0&REQUEST=GetMap&LAYERS=${config.layers}&styles=default-categorical&crs=EPSG:3857&format=image/png&transparent=true&width=256&height=256`;
};

export const rasterLegendUrl = async (id: RasterSource, date: Date): Promise<string> => {
  const base = await baseUrl(id, date);
  const config = WMS_CONFIG[id];
  return `/legends${base}?version=1.3.0&COLORSCALERANGE=${config.colorScaleRange}&REQUEST=GetLegendGraphic&palette=${config.legendPalette}&COLORBARONLY=true&VERTICAL=false&WIDTH=443&HEIGHT=12`;
};

export const getFeatureInfoUrl = async (
  id: RasterSource,
  date: Date,
  mapBounds: [number, number, number, number], // [west, south, east, north]
  mapSize: { width: number; height: number },
  clickPoint: { x: number; y: number },
): Promise<string> => {
  const base = await baseUrl(id, date);
  const layerName = WMS_CONFIG[id].layers;

  // WMS 1.3.0 uses EPSG:4326 (lat,lon order for this CRS)
  const [west, south, east, north] = mapBounds;
  const bbox = `${south},${west},${north},${east}`;

  return `${base}?REQUEST=GetFeatureInfo&SERVICE=WMS&VERSION=1.3.0&LAYERS=${layerName}&QUERY_LAYERS=${layerName}&CRS=EPSG:4326&BBOX=${bbox}&WIDTH=${mapSize.width}&HEIGHT=${mapSize.height}&I=${Math.floor(clickPoint.x)}&J=${Math.floor(clickPoint.y)}&INFO_FORMAT=text/xml`;
};

// cloudfront caching for thredds wms tiles and legend urls. /tiles/* bheaviour for tiles cache. /legends/* behaviour for legend cache.
// For tiles cache, lambda@edge to convert /tiles/{z}/{x}/{y} to bbox and forward to thredds endpoint.
// For legend cache, cloud function to remove /legends prefix and forward to thredds endpoint.
