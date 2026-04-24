import type { MapMouseEvent } from 'mapbox-gl';
import { getFeatureInfoUrl } from './threddsUrl';
import type { RasterSource } from '@/constants';
import { GSLA_ANOMALY_SOURCE_ID, SST_ANOMALY_MOSAIC_SOURCE_ID, PRODUCT } from '@/constants';

/**
 * Parses XML response from WMS GetFeatureInfo request
 * @param xmlString - The XML response string
 * @returns The numeric value from the first FeatureInfo element, or null if not found
 */
function parseFeatureInfoXML(xmlString: string): number | null {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    // Check for parsing errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      console.error('XML parsing error:', parserError.textContent);
      return null;
    }

    const valueElement = xmlDoc.querySelector('FeatureInfoResponse FeatureInfo value');
    if (!valueElement?.textContent) {
      return null;
    }

    const value = Number(valueElement.textContent);
    return isNaN(value) ? null : value;
  } catch (error) {
    console.error('Error parsing feature info XML:', error);
    return null;
  }
}

type RasterSourceData = {
  [GSLA_ANOMALY_SOURCE_ID]: {
    [PRODUCT.GSLA_ANOMALY_SEA_LEVELS]: { gsla: number };
  };
  [SST_ANOMALY_MOSAIC_SOURCE_ID]: {
    [PRODUCT.SST_ANOMALY_MOSAIC]: { sstAnom: number };
  };
};

/**
 * Fetches raster data (GSLA or SST Anomaly) from THREDDS WMS service
 */
const fetchRasterData =
  <T extends RasterSource>(rasterSource: T) =>
  async (
    date: string,
    mapBounds: [number, number, number, number],
    mapSize: { width: number; height: number },
    point: MapMouseEvent['point'],
  ): Promise<Partial<RasterSourceData[T]>> => {
    try {
      const url = await getFeatureInfoUrl(rasterSource, new Date(date), mapBounds, mapSize, point);

      const response = await fetch(url);

      const xmlString = await response.text();
      const value = parseFeatureInfoXML(xmlString);

      if (value === null) {
        return {};
      }

      // Map the value to the appropriate Product field based on raster source
      if (rasterSource === GSLA_ANOMALY_SOURCE_ID) {
        return {
          [PRODUCT.GSLA_ANOMALY_SEA_LEVELS]: { gsla: value },
        } as RasterSourceData[T];
      } else if (rasterSource === SST_ANOMALY_MOSAIC_SOURCE_ID) {
        return {
          [PRODUCT.SST_ANOMALY_MOSAIC]: { sstAnom: value },
        } as RasterSourceData[T];
      }

      return {};
    } catch (error) {
      console.error('Error fetching raster data:', error);
      throw error; // let react query catch and handle error.
    }
  };

export const fetchGslaAnomalySeaLevelsData = fetchRasterData(GSLA_ANOMALY_SOURCE_ID);
export const fetchSstAnomalyMosaic = fetchRasterData(SST_ANOMALY_MOSAIC_SOURCE_ID);

export function getMapMetaData(map: React.RefObject<mapboxgl.Map | null>) {
  if (!map.current) return {};

  const bounds = map.current.getBounds();
  const mapBounds: [number, number, number, number] | undefined = bounds
    ? [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()]
    : undefined;
  const mapSize = {
    width: map.current.getCanvas().width,
    height: map.current.getCanvas().height,
  };

  return {
    mapBounds,
    mapSize,
  };
}
