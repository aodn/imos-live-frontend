import type { Meta, StoryObj } from '@storybook/react';
import { Slider } from './Slider';
import { TriangleIcon } from '../Icons';

const meta = {
  title: 'components/Slider/Slider',
  component: Slider,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

const generateData = (startYear: number, endYear: number) => {
  const data = [];

  for (let year = startYear; year <= endYear; year++) {
    const baseValue = 50;
    const waveValue = Math.sin((year - startYear) * 0.3) * 20;
    const randomVariation = (Math.random() - 0.5) * 10;
    const value = baseValue + waveValue + randomVariation;

    data.push({
      year,
      value: Math.max(0, Math.min(100, value)),
    });
  }

  return data;
};

export const Combined: Story = {
  args: {
    viewMode: 'combined',
    startYear: 1990,
    endYear: 2025,
    currentPointYear: 1998,
    allData: generateData(1990, 2025),
    pointHandleIcon: <TriangleIcon size="xl" color="imos-grey" />,
    rangeHandleIcon: <TriangleIcon size="xl" color="imos-grey" className="rotate-180" />,
  },
  render: args => {
    return <Slider {...args} />;
  },
};

export const Point: Story = {
  args: {
    viewMode: 'point',
    startYear: 1990,
    endYear: 2025,
    currentPointYear: 1998,
    allData: generateData(1990, 2025),
    pointHandleIcon: <TriangleIcon size="xl" color="imos-grey" />,
  },
  render: args => {
    return <Slider {...args} />;
  },
};

export const Range: Story = {
  args: {
    viewMode: 'range',
    startYear: 1990,
    endYear: 2025,
    currentPointYear: 1998,
    allData: generateData(1990, 2025),
    rangeHandleIcon: <TriangleIcon size="xl" color="imos-grey" className="rotate-180" />,
  },
  render: args => {
    return <Slider {...args} />;
  },
};
