import { useEffect, useRef } from 'react';
import { shortDateFormatToUTC } from '@/utils';
import { useSearchParams } from 'react-router-dom';
import { INITIAL_DATASET } from '@/store';
import { SliderExposedMethod } from '@/components/DateSlider';

//sync dataset date from query parameters in url to DateSlider.
export function useSliderDateSyncWithUrl(
  dataset: string,
  sliderMethodRef: React.RefObject<SliderExposedMethod | null>,
) {
  const [searchParams] = useSearchParams();
  const lastDataset = useRef<string | null>(null);
  const attemptCount = useRef(0);

  useEffect(() => {
    const setDateTime = sliderMethodRef.current?.setDateTime;
    if (!setDateTime || !dataset) return;

    if (lastDataset.current === dataset) return;

    const sharedDataset = searchParams.get('dataset');
    const maxAttempts = sharedDataset && sharedDataset !== INITIAL_DATASET ? 2 : 1;

    attemptCount.current += 1;
    if (attemptCount.current > maxAttempts) return;

    lastDataset.current = dataset;
    setDateTime(shortDateFormatToUTC(dataset), 'point');
  }, [dataset, searchParams, sliderMethodRef]);
}
