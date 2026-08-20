import { useMemo, type RefObject } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Button } from '../Button';
import { DatePicker } from '../DatePicker';
import {
  useDateSliderState,
  type DateSliderStore,
  type NaiveDateTime,
  type SliderExposedMethod,
} from '../DateSlider';
import { cn } from '@/utils';

dayjs.extend(utc);

/** Rendered width (px) of the selection panel. */
export const SELECTION_PANEL_WIDTH = 188;

const LABEL_FORMAT = 'DD MMM YYYY';

type DateSelectionPanelProps = {
  /** Store the slider publishes its live selected date to. */
  store: DateSliderStore;
  /** Slider's imperative handle — drives prev/next stepping. */
  sliderRef: RefObject<SliderExposedMethod | null>;
  /** Shown until the slider has published its first live state. */
  fallbackDate: NaiveDateTime;
  /** Earliest selectable date (naive, timezone-free, inclusive) for the picker. */
  min: NaiveDateTime;
  /** Latest selectable date (naive, timezone-free, inclusive) for the picker. */
  max: NaiveDateTime;
  className?: string;
};

/**
 * The left cap of the DateSelectionBar: the current date label, a date picker,
 * and prev/next steppers. Rendered as a sibling of the slider (not inside it) so
 * it stays visible while the slider collapses. Reads the live selected date from
 * the slider's {@link DateSliderStore} and drives it via the imperative handle.
 */
export function DateSelectionPanel({
  store,
  sliderRef,
  fallbackDate,
  min,
  max,
  className,
}: DateSelectionPanelProps) {
  const { pointDate } = useDateSliderState(store);
  const date = pointDate ?? fallbackDate;
  const dateLabel = useMemo(() => dayjs.utc(date).format(LABEL_FORMAT), [date]);

  return (
    <div
      style={{ width: SELECTION_PANEL_WIDTH }}
      className={cn(
        'flex items-center gap-1 frosted rounded-lg md:rounded-r-none h-16 px-2 py-1.5 shrink-0 overflow-hidden md:border-r border-imos-black/70',
        className,
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={() => sliderRef.current?.moveByStep('backward', 'point')}
        className="p-1 hover:bg-white/30 rounded"
        aria-label="Previous date"
      >
        <ChevronLeftIcon className="w-4 h-4 text-imos-black" />
      </Button>
      <span className="text-sm font-semibold text-imos-black flex-1 text-center whitespace-nowrap">
        {dateLabel}
      </span>
      {/* Picking drives the slider via the imperative path: it moves the handle
          and fires the slider's onChange (→ store + URL), same as a date jump. */}
      <DatePicker
        value={date}
        min={min}
        max={max}
        onChange={picked => sliderRef.current?.setDateTime(picked)}
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => sliderRef.current?.moveByStep('forward', 'point')}
        className="p-1 hover:bg-white/30 rounded"
        aria-label="Next date"
      >
        <ChevronRightIcon className="w-4 h-4 text-imos-black" />
      </Button>
    </div>
  );
}
