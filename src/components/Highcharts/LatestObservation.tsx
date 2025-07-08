import { convertToLocalDateTime, cn } from '@/utils';
import { WaveBuoyDetailsFeatureCollection, WaveBuoyDetailsProperties } from '@/types';
import { obseravtionVariants } from './config';
import { useMemo } from 'react';

export type ObservationData = {
  timeStamp: string | number | undefined;
  label: string | undefined;
  value: string | number | undefined;
  unit: string | undefined;
}[];

export function LatestObservation({
  multiData,
}: {
  multiData: WaveBuoyDetailsFeatureCollection[] | null;
}) {
  const numOfCols = 3;
  const gridColsClass = (numOfCols: number) =>
    ({
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
      7: 'grid-cols-7',
      8: 'grid-cols-8',
      9: 'grid-cols-9',
      10: 'grid-cols-10',
      11: 'grid-cols-11',
      12: 'grid-cols-12',
    })[numOfCols];

  const observationData: ObservationData = useMemo(() => {
    if (!Array.isArray(multiData) || multiData.length === 0) return [];

    const latestData = multiData
      .sort((a, b) => a.metadata.date.localeCompare(b.metadata.date))
      .at(-1);

    const properties = latestData?.features?.[0]?.properties ?? ({} as WaveBuoyDetailsProperties);
    const keys = obseravtionVariants;

    return keys.map(key => {
      const p = properties[key];
      const data = p?.data ?? [];

      const lastData = data.at(-1);
      let timestamp, value;
      if (Array.isArray(lastData)) {
        [timestamp, value] = lastData;
      } else {
        timestamp = undefined;
        value = undefined;
      }

      return {
        timeStamp: timestamp,
        label: p?.long_name,
        value,
        unit: p?.units,
      };
    });
  }, [multiData]);

  return (
    <div className="w-full">
      <div className="border  border-gray-300 ">
        <div className="bg-gray-50 border-b border-gray-300 px-3 py-2">
          <h2 className="text-sm font-medium text-gray-800">
            <span>Latest Observations</span>
            {observationData[0]?.timeStamp && (
              <span className="text-xs font-light ml-2">
                {convertToLocalDateTime(observationData[0].timeStamp).toLocaleString()}
              </span>
            )}
          </h2>
        </div>

        <div className={cn('grid w-full', gridColsClass(numOfCols))}>
          {observationData?.map((field, index) => (
            <div
              key={field.label || '' + index}
              className={cn('col-span-1 border-r border-t border-b', {
                'border-r-0': (index + 1) % numOfCols === 0,
                'border-t-0': index < numOfCols,
                'border-b-0':
                  Math.ceil(observationData.length / numOfCols) - 1 ===
                  Math.floor(index / numOfCols),
              })}
            >
              {
                <div className="px-3 py-2">
                  <div className="text-xs text-gray-600 mb-1">
                    {field.label} {field.unit && `(${field.unit})`}
                  </div>
                  <div className="text-sm font-medium text-gray-900">{field.value}</div>
                </div>
              }
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
