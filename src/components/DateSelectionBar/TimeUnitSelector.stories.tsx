import type { Meta, StoryObj } from '@storybook/react';
import { useMemo, type RefObject } from 'react';
import { TimeUnitSelector } from './TimeUnitSelector';
import { createDateSliderStore, type SliderExposedMethod, type TimeUnit } from '../DateSlider';

const meta: Meta<typeof TimeUnitSelector> = {
  title: 'Components/DateSelectionBar/TimeUnitSelector',
  component: TimeUnitSelector,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          "The right cap of the DateSelectionBar: a dropdown + prev/next steppers for the slider's time unit. Reads the active unit and month validity from the slider's state store and commits changes through the imperative handle.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof TimeUnitSelector>;

/** Standalone harness: a seeded store + a fake imperative handle that sets the unit. */
function SelectorHarness({ monthValid }: { monthValid: boolean }) {
  const store = useMemo(() => {
    const s = createDateSliderStore('day');
    s.setState({
      ...s.getSnapshot(),
      pointDate: new Date(Date.UTC(2023, 5, 15)),
      timeUnit: 'day',
      isMonthValid: monthValid,
      isYearValid: false,
    });
    return s;
  }, [monthValid]);

  const sliderRef = useMemo<RefObject<SliderExposedMethod | null>>(
    () => ({
      current: {
        setDateTime: () => {},
        moveByStep: () => {},
        setTimeUnit: (timeUnit: TimeUnit) => store.setState({ ...store.getSnapshot(), timeUnit }),
        focusHandle: () => {},
      },
    }),
    [store],
  );

  return (
    <div className="h-16">
      <TimeUnitSelector store={store} sliderRef={sliderRef} />
    </div>
  );
}

export const Default: Story = {
  render: () => <SelectorHarness monthValid />,
};

/** Range shorter than a month — the month unit (and the next-unit stepper) is disabled. */
export const MonthDisabled: Story = {
  render: () => <SelectorHarness monthValid={false} />,
};
