/* eslint-disable react-hooks/rules-of-hooks */
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Slider } from './Slider';
import { LabeledSlider } from './LabeledSlider';

const sliderMeta = {
  title: 'Components/Slider/Slider',
  component: Slider,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Slider>;

export default sliderMeta;
type SliderStory = StoryObj<typeof sliderMeta>;

export const BasicSlider: SliderStory = {
  render: args => {
    const [value, setValue] = useState(args.value || 0.5);
    return (
      <div className="w-64">
        <Slider {...args} value={value} onChange={setValue} />
      </div>
    );
  },
  args: {
    value: 0.5,
    min: 0,
    max: 1,
    step: 0.01,
    onChange: () => {},
  },
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const labeledSliderMeta = {
  title: 'Components/Slider/LabeledSlider',
  component: LabeledSlider,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LabeledSlider>;

type LabeledSliderStory = StoryObj<typeof labeledSliderMeta>;

export const Default: LabeledSliderStory = {
  render: args => {
    const [value, setValue] = useState(args.value || 0.03);
    return <LabeledSlider {...args} value={value} onChange={setValue} />;
  },
  args: {
    label: 'dropRateBump',
    value: 0.03,
    min: 0,
    max: 1,
    step: 0.01,
    decimals: 2,
    onChange: () => {},
  },
};

export const WithDifferentRange: LabeledSliderStory = {
  render: args => {
    const [value, setValue] = useState(args.value || 50);
    return <LabeledSlider {...args} value={value} onChange={setValue} />;
  },
  args: {
    label: 'Volume',
    value: 50,
    min: 0,
    max: 100,
    step: 1,
    decimals: 0,
    onChange: () => {},
  },
};
export const WithHighPrecision: LabeledSliderStory = {
  render: args => {
    const [value, setValue] = useState(args.value || 0.5);
    return <LabeledSlider {...args} value={value} onChange={setValue} />;
  },
  args: {
    label: 'Opacity',
    value: 0.5,
    min: 0,
    max: 1,
    step: 0.001,
    decimals: 3,
    onChange: () => {},
  },
};
