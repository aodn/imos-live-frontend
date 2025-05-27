import type { Meta, StoryObj } from '@storybook/react';
import { Drawer, DrawerProps } from './Drawer';
import { useDrawerStore } from '@/store';
import { useShallow } from 'zustand/shallow';
import { Button } from '../Button';

const meta = {
  title: 'components/Drawer',
  component: Drawer,
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

const DrawerContent = () => {
  return (
    <div>
      <h2 className="text-lg font-bold mb-2">Drawer Content</h2>
      <p>Everything goes here.</p>
    </div>
  );
};

const DrawerDemo = ({ snapPoints, snapMode, direction, className, onClose }: DrawerProps) => {
  const { openDrawer, content } = useDrawerStore(
    useShallow(s => ({
      openDrawer: s.openDrawer,
      content: s.content,
    })),
  );
  return (
    <>
      <Button variant="default" onClick={() => openDrawer(<DrawerContent />)}>
        open drawer
      </Button>
      <Drawer
        className={className}
        snapMode={snapMode}
        direction={direction}
        snapPoints={snapPoints}
        onClose={onClose}
        children={content}
      />
    </>
  );
};

export const Demo: Story = {
  render: args => <DrawerDemo {...args} />,
  args: {
    snapMode: 'snap',
    direction: 'bottom',
    snapPoints: ['30%', '50%', '70%'],
    className: '',
    onClose: () => console.log('Drawer closed'),
  },
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          'This story demonstrates the Drawer integrated with Zustand store. Use the button to open the drawer. Controls are disabled because Drawer state is managed globally via Zustand.',
      },
    },
  },
};
