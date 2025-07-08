import { WaveBuoyDetailsFeatureCollection } from '@/types';

/**
 * Merges ALL parameter data from multiple collections
 * @param collections - Array of WaveBuoyDetailsFeatureCollection
 * @returns Object with merged data for all parameters found in the collections
 */
export function mergeAllParametersData(
  collections: WaveBuoyDetailsFeatureCollection[],
): Record<string, Array<[number, number]>> {
  if (collections.length === 0) {
    return {};
  }

  // Get all unique parameter names from all collections
  const allParameterNames = new Set<string>();

  collections.forEach(collection => {
    if (collection.features.length > 0) {
      const properties = collection.features[0].properties;
      Object.keys(properties).forEach(key => {
        // Skip non-data properties
        if (
          key !== 'date' &&
          key !== 'location' &&
          key !== 'time_range' &&
          key !== 'recourds_count' &&
          properties[key]?.data &&
          Array.isArray(properties[key].data)
        ) {
          allParameterNames.add(key);
        }
      });
    }
  });

  // Merge data for each parameter
  const result: Record<string, Array<[number, number]>> = {};

  allParameterNames.forEach(parameterName => {
    const allData: Array<[number, number]> = [];

    collections.forEach(collection => {
      if (collection.features.length > 0) {
        const feature = collection.features[0];
        const parameterData = feature.properties[parameterName];

        if (parameterData?.data && Array.isArray(parameterData.data)) {
          allData.push(...parameterData.data);
        }
      }
    });

    // Sort by timestamp and remove duplicates
    const uniqueData = new Map<number, number>();
    allData.forEach(([timestamp, value]) => {
      uniqueData.set(timestamp, value);
    });

    result[parameterName] = Array.from(uniqueData.entries()).sort((a, b) => a[0] - b[0]);
  });

  return result;
}

/**
 * Creates a new WaveBuoyDetailsFeatureCollection with ALL merged parameter data
 * @param collections - Array of WaveBuoyDetailsFeatureCollection to merge
 * @returns New collection with merged data for all parameters
 */
export function createMergedCollectionWithAllParameters(
  collections: WaveBuoyDetailsFeatureCollection[],
): WaveBuoyDetailsFeatureCollection | undefined {
  if (!collections || collections.length === 0) {
    return;
  }

  const firstCollection = collections[0];
  const mergedParametersData = mergeAllParametersData(collections);

  // Extract date range from all collections
  const allDates = collections.map(c => c.metadata.date).sort();
  const dateRange =
    allDates.length > 1 ? `${allDates[0]} to ${allDates[allDates.length - 1]}` : allDates[0];

  // Find overall time range from all merged data
  let earliestTimestamp = Infinity;
  let latestTimestamp = -Infinity;

  Object.values(mergedParametersData).forEach(dataArray => {
    if (dataArray.length > 0) {
      earliestTimestamp = Math.min(earliestTimestamp, dataArray[0][0]);
      latestTimestamp = Math.max(latestTimestamp, dataArray[dataArray.length - 1][0]);
    }
  });

  // Build merged properties with all parameters
  const mergedProperties: any = {
    date: dateRange,
    location: firstCollection.features[0].properties.location,
    time_range: {
      start: new Date(earliestTimestamp).toISOString(),
      end: new Date(latestTimestamp).toISOString(),
    },
    recourds_count: Object.values(mergedParametersData).reduce(
      (max, dataArray) => Math.max(max, dataArray.length),
      0,
    ),
  };

  // Add all merged parameters with their original metadata
  Object.keys(mergedParametersData).forEach(parameterName => {
    // Get original parameter metadata from first collection that has it
    let originalParameter = null;
    for (const collection of collections) {
      if (collection.features.length > 0) {
        const param = collection.features[0].properties[parameterName];
        if (param) {
          originalParameter = param;
          break;
        }
      }
    }

    if (originalParameter) {
      mergedProperties[parameterName] = {
        ...originalParameter,
        data: mergedParametersData[parameterName],
      };
    }
  });

  return {
    type: 'FeatureCollection',
    metadata: {
      ...firstCollection.metadata,
      date: dateRange,
      description: `Merged data from ${collections.length} collections with ${Object.keys(mergedParametersData).length} parameters`,
      generated_at: new Date().toISOString(),
    },
    features: [
      {
        type: 'Feature',
        geometry: firstCollection.features[0].geometry,
        properties: mergedProperties,
      },
    ],
  };
}
