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
          'Frosted month-grid date picker used in the DateSelectionBar. Operates entirely in UTC and clamps selection to the slider range [min, max]. The calendar popover is portaled to the document body and opens above its trigger.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DatePicker>;

const min = new Date('2026-01-01T00:00:00Z');
const max = new Date('2026-12-31T00:00:00Z');

export const Default: Story = {
  args: {
    value: new Date('2026-06-15T00:00:00Z'),
    onChange: () => {},
  },
};

export const Interactive: Story = {
  render: () => {
    const [value, setValue] = useState(new Date('2026-06-15T00:00:00Z'));
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm">{value.toISOString().slice(0, 10)}</span>
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
    ].map(d => new Date(`${d}T00:00:00Z`));
    const [value, setValue] = useState(dateList[0]);
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm">{value.toISOString().slice(0, 10)}</span>
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
    value: new Date('2026-06-15T00:00:00Z'),
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
