import type { Meta, StoryObj } from '@storybook/react';
import { useMemo, type RefObject } from 'react';
import { DateSelectionPanel } from './DateSelectionPanel';
import { createDateSliderStore, type NaiveDateTime, type SliderExposedMethod } from '../DateSlider';
import { toISODateString, toUTCDate } from '@/utils';

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

const MIN = new Date(Date.UTC(2020, 0, 1));
const MAX = new Date(Date.UTC(2024, 11, 31));

/** Standalone harness: a seeded store + a fake imperative handle that steps the date. */
function PanelHarness({ initialDate }: { initialDate: Date }) {
  const store = useMemo(() => {
    const s = createDateSliderStore('day');
    s.setState({
      ...s.getSnapshot(),
      pointDate: toISODateString(initialDate),
      timeUnit: 'day',
      isMonthValid: true,
      isYearValid: true,
    });
    return s;
  }, [initialDate]);

  const sliderRef = useMemo<RefObject<SliderExposedMethod | null>>(() => {
    const publish = (date: Date) =>
      store.setState({
        ...store.getSnapshot(),
        pointDate: toISODateString(date),
        timeUnit: 'day',
        isMonthValid: true,
        isYearValid: true,
      });
    return {
      current: {
        setDateTime: (date: NaiveDateTime) => publish(toUTCDate(date)),
        moveByStep: direction => {
          const currentPointDate = store.getSnapshot().pointDate;
          const current = currentPointDate ? toUTCDate(currentPointDate) : initialDate;
          const next = new Date(current);
          next.setUTCDate(next.getUTCDate() + (direction === 'forward' ? 1 : -1));
          publish(next);
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
  render: () => <PanelHarness initialDate={new Date(Date.UTC(2023, 5, 15))} />,
};

export const EarlierDate: Story = {
  render: () => <PanelHarness initialDate={new Date(Date.UTC(2021, 0, 1))} />,
};
