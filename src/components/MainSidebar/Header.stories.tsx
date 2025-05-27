import type { Meta, StoryObj } from '@storybook/react';
import { Header } from './Header';

const meta = {
  title: 'components/MainSidebar/Header',
  component: Header,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    title: 'IMOS Live',
    image: {
      src: 'src/assets/imos_logo_with_title.png',
      alt: 'IMOS Logo',
      height: 63,
      width: 147,
    },
  },
};
