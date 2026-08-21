import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { DatePicker } from './DatePicker';

const meta: Meta<typeof DatePicker> = {
  title: 'Components/DatePicker',
  component: DatePicker,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Frosted month-grid date picker used in the DateSelectionBar. Operates on naive (timezone-free) date strings and clamps selection to the slider range [min, max) — max exclusive. The calendar popover is portaled to the document body and opens above its trigger.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DatePicker>;

const min = '2026-01-01';
// Exclusive — last selectable day is 2026-12-31.
const max = '2027-01-01';

export const Default: Story = {
  args: {
    value: '2026-06-15',
    onChange: () => {},
  },
};

export const Interactive: Story = {
  render: () => {
    const [value, setValue] = useState('2026-06-15');
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm">{value}</span>
        <DatePicker value={value} min={min} max={max} onChange={setValue} />
      </div>
    );
  },
};

/**
 * List mode: pass `dateList` instead of `min`/`max` — only the listed dates are
 * selectable, and months/years with no listed date are disabled.
 */
export const DateListMode: Story = {
  render: () => {
    // A sparse set of available dates across two months.
    const dateList = [
      '2026-06-03',
      '2026-06-10',
      '2026-06-17',
      '2026-06-24',
      '2026-08-05',
      '2026-08-19',
    ];
    const [value, setValue] = useState(dateList[0]);
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm">{value}</span>
        <DatePicker value={value} dateList={dateList} onChange={setValue} />
      </div>
    );
  },
};

/**
 * Styling is fully prop-driven — this re-skins every slot with an emerald accent
 * while keeping the frosted popover, so it stays readable and the icons stay
 * visible.
 */
export const Themed: Story = {
  args: {
    value: '2026-06-15',
    min,
    max,
    placement: 'bottom',
    onChange: () => {},
    classNames: {
      trigger: 'p-1 rounded hover:bg-emerald-500/20',
      popover: 'rounded-xl p-3 w-72 border-emerald-600/40 shadow-xl',
      navButton: 'p-1 rounded hover:bg-emerald-500/20 disabled:opacity-40',
      monthSelect: 'rounded px-1 py-0.5 hover:bg-emerald-500/20',
      yearSelect: 'rounded px-1 py-0.5 hover:bg-emerald-500/20',
      weekday: 'text-center text-[10px] font-semibold uppercase tracking-wide text-emerald-700',
      day: 'h-8 rounded text-sm hover:bg-emerald-500/20',
      daySelected: 'bg-emerald-500 text-white font-semibold hover:bg-emerald-500',
    },
  },
};
