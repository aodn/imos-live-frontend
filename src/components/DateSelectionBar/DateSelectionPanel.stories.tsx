import type { Meta, StoryObj } from '@storybook/react';
import { useMemo, type RefObject } from 'react';
import { DateSelectionPanel } from './DateSelectionPanel';
import { createDateSliderStore, type NaiveDateTime, type SliderExposedMethod } from '../DateSlider';
import { utcToDateOnly, naiveToUTCDate } from '@/utils';

const meta: Meta<typeof DateSelectionPanel> = {
  title: 'Components/DateSelectionBar/DateSelectionPanel',
  component: DateSelectionPanel,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          "The left cap of the DateSelectionBar: current-date label, date picker, and prev/next steppers. It reads the live selected date from the slider's state store and steps via the imperative handle, so it can live outside the slider and stay visible while the slider collapses.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DateSelectionPanel>;

const MIN: NaiveDateTime = '2020-01-01';
// Exclusive — last selectable day is 2024-12-31.
const MAX: NaiveDateTime = '2025-01-01';

/** Standalone harness: a seeded store + a fake imperative handle that steps the date. */
function PanelHarness({ initialDate }: { initialDate: NaiveDateTime }) {
  const store = useMemo(() => {
    const s = createDateSliderStore('day');
    s.setState({
      ...s.getSnapshot(),
      pointDate: initialDate,
      timeUnit: 'day',
      isMonthValid: true,
      isYearValid: true,
    });
    return s;
  }, [initialDate]);

  const sliderRef = useMemo<RefObject<SliderExposedMethod | null>>(() => {
    const publish = (date: NaiveDateTime) =>
      store.setState({
        ...store.getSnapshot(),
        pointDate: date,
        timeUnit: 'day',
        isMonthValid: true,
        isYearValid: true,
      });
    return {
      current: {
        setDateTime: publish,
        moveByStep: direction => {
          const currentPointDate = store.getSnapshot().pointDate ?? initialDate;
          const next = naiveToUTCDate(currentPointDate);
          next.setUTCDate(next.getUTCDate() + (direction === 'forward' ? 1 : -1));
          publish(utcToDateOnly(next));
        },
        setTimeUnit: () => {},
        focusHandle: () => {},
      },
    };
  }, [store, initialDate]);

  return (
    <DateSelectionPanel
      store={store}
      sliderRef={sliderRef}
      fallbackDate={initialDate}
      min={MIN}
      max={MAX}
    />
  );
}

export const Default: Story = {
  render: () => <PanelHarness initialDate="2023-06-15" />,
};

export const EarlierDate: Story = {
  render: () => <PanelHarness initialDate="2021-01-01" />,
};
