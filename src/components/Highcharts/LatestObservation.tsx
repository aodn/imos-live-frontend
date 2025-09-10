import { WaveBuoyDetailsFeatureCollection } from '@/types';
import { cn, toLocalDateTime } from '@/utils';
import { useMemo } from 'react';
import { obseravtionVariants } from './config';

export type ObservationData = {
  timeStamp: string | number | undefined;
  label: string | undefined;
  value: string | number | undefined;
  unit: string | undefined;
}[];

const productDescription = {
  SSWMD: {
    long_name: 'spectral sea surface wave mean direction',
    units: 'Degrees',
  },
  WPFM: {
    long_name: 'sea surface wave spectral mean period',
    units: 's',
  },
  WSSH: {
    long_name: 'sea surface wave spectral significant height',
    units: 'm',
  },
};

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

    const latestData = multiData.slice(-1)[0];

    const properties = latestData?.features?.[0]?.properties || {};
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
        label: productDescription[key].long_name,
        value,
        unit: productDescription[key].units,
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
              <span className="text-xs font-light ml-2" data-testid="latest-observation-timestamp">
                {toLocalDateTime(observationData[0].timeStamp)}
              </span>
            )}
          </h2>
        </div>

        <div className={cn('grid w-full', gridColsClass(numOfCols))}>
          {observationData?.map((field, index, values) => (
            <div
              key={field.label || '' + index}
              className={cn('col-span-1', {
                'border-r': values.length !== index + 1,
              })}
            >
              {
                <div className="px-3 py-2">
                  <div
                    className="text-xs text-gray-600 mb-1"
                    data-testid="latest-observation-label"
                  >
                    {field.label} {field.unit && `(${field.unit})`}
                  </div>
                  <div
                    className="text-sm font-medium text-gray-900"
                    data-testid="latest-observation-value"
                  >
                    {field.value}
                  </div>
                </div>
              }
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
