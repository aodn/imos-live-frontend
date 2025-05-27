import type { Meta, StoryObj } from '@storybook/react';
import { IconTable } from './IconTable';

const meta = {
  title: 'components/IconTable',
  component: IconTable,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof IconTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    size: 'lg',
    color: 'imos-red',
    className: '',
  },
};
