import type { Meta, StoryObj } from '@storybook/react';
import { SymLogColorScaleBar } from './SymLogColorScaleBar';

const meta = {
  title: 'Components/ColorScaleBar/symlog',
  component: SymLogColorScaleBar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof SymLogColorScaleBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    className: 'w-80',
    min: -1.2,
    max: 1.2,
  },
};
