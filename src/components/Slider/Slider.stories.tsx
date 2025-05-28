import type { Meta, StoryObj } from '@storybook/react';
import { Slider } from './Slider';

const meta = {
  title: 'components/Slider',
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
    // Create a wavy pattern similar to the image
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

export const Primary: Story = {
  args: {
    viewMode: 'combined',
    startYear: 1990,
    endYear: 2025,
    currentPointYear: 1998,
    allData: generateData(1990, 2025),
  },
  render: args => {
    return <Slider {...args} />;
  },
};
