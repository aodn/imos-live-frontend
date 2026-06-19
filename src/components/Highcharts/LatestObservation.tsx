import type { BuoyItem, SiteDetailsFeature } from '@/types';
import { cn, utcToLocalDateTime, prioritizeKey } from '@/utils';
import { useMemo } from 'react';
import { obseravtionVariants, preferredVariant, variantDescription } from './config';

export type ObservationField = {
  timeStamp: string | number | undefined;
  label: string | undefined;
  value: string | number | undefined;
  unit: string | undefined;
};

export type ObservationData = ObservationField[];

function buildObservationData(feature: SiteDetailsFeature<BuoyItem>): ObservationData {
  const { properties } = feature;

  const fields = obseravtionVariants
    .filter(key => (properties[key] ?? []).length > 0)
    // Drop a variant when its preferred counterpart is also present (e.g. hide WHTH when WSSH exists).
    .filter((key, _index, keys) => {
      const preferred = preferredVariant[key];
      return !preferred || !keys.includes(preferred);
    })
    .map(key => {
      const lastData = (properties[key] ?? []).at(-1);
      const [timeStamp, value] = Array.isArray(lastData) ? lastData : [undefined, undefined];
      return {
        timeStamp,
        label: variantDescription[key].long_name,
        value,
        unit: variantDescription[key].units,
      };
    });

  return prioritizeKey(fields, 'label', variantDescription.WSSH.long_name);
}

function gridColsClass(numOfCols: number): string | undefined {
  return {
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
  }[numOfCols];
}

function ObservationCell({ field, isLast }: { field: ObservationField; isLast: boolean }) {
  return (
    <div className={cn('col-span-1', { 'border-r': !isLast })}>
      <div className="px-3 py-2">
        <div className="text-xs text-gray-600 mb-1" data-testid="latest-observation-label">
          {field.label} {field.unit && `(${field.unit})`}
        </div>
        <div className="text-sm font-medium text-gray-900" data-testid="latest-observation-value">
          {field.value}
        </div>
      </div>
    </div>
  );
}

// Presentational panel shared by the buoy and mooring charts; callers pass in their
// own pre-built observation data (built differently per data shape).
export function ObservationPanel({ observationData }: { observationData: ObservationData }) {
  const latestTimeStamp = observationData[0]?.timeStamp;

  return (
    <div className="w-full">
      <div className="border border-gray-300">
        <div className="bg-gray-50 border-b border-gray-300 px-3 py-2">
          <h2 className="text-sm font-medium text-gray-800">
            <span>Latest Observations</span>
            {latestTimeStamp && (
              <span className="text-xs font-light ml-2" data-testid="latest-observation-timestamp">
                {utcToLocalDateTime(latestTimeStamp)}
              </span>
            )}
          </h2>
        </div>

        <div className={cn('grid w-full', gridColsClass(observationData.length))}>
          {observationData.map((field, index) => (
            <ObservationCell
              key={field.label ?? index}
              field={field}
              isLast={index === observationData.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function LatestObservation({
  feature,
}: {
  feature: SiteDetailsFeature<BuoyItem> | undefined;
}) {
  const observationData = useMemo(
    () => (feature?.properties ? buildObservationData(feature) : []),
    [feature],
  );

  return <ObservationPanel observationData={observationData} />;
}
