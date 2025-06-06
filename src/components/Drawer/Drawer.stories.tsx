/* eslint-disable react-hooks/rules-of-hooks */
import type { Meta, StoryObj } from '@storybook/react';
import { Drawer } from './Drawer';
import type { DrawerProps } from './Drawer';
import { useDrawerStore } from '@/store';
import { useShallow } from 'zustand/shallow';
import { Button } from '../Button';

const meta: Meta<typeof Drawer> = {
  title: 'components/Drawer',
  component: Drawer,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        story:
          'This story demonstrates the Drawer integrated with Zustand store. Use the button to open the drawer. Controls are disabled because Drawer state is managed globally via Zustand.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Drawer>;

const DrawerContent = () => (
  <div>
    <h2 className="text-lg font-bold mb-2">Drawer Content</h2>
    <p>Everything goes here.</p>
  </div>
);

export const Demo: Story = {
  args: {
    snapMode: 'snap',
    direction: 'bottom',
    snapPoints: ['30%', '50%', '70%'],
    className: '',
    onClose: () => console.log('Drawer closed'),
  },
  render: (args: DrawerProps) => {
    const { openDrawer, content } = useDrawerStore(
      useShallow(state => ({
        openDrawer: state.openDrawer,
        content: state.content,
      })),
    );

    return (
      <>
        <Button variant="default" onClick={() => openDrawer(<DrawerContent />)}>
          Open Drawer
        </Button>
        <Drawer {...args}>{content}</Drawer>
      </>
    );
  },
};
