import type { Meta, StoryObj } from '@storybook/react';
import { TimeUnitSelection } from './TimeUnitSelection';
const meta: Meta<typeof TimeUnitSelection> = {
  title: 'Components/DateSlider/TimeUnitSelection',
  component: TimeUnitSelection,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof TimeUnitSelection>;

export const Default: Story = {
  args: {
    initialTimeUnit: 'day',
    isMonthValid: true,
    isYearValid: false,
    onChange: v => console.log(v),
  },
};
