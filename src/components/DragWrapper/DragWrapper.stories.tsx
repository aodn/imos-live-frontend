import type { Meta, StoryObj } from '@storybook/react';
import { DragWrapper } from './DragWrapper';
import { cn } from '@/utils';

const meta = {
  title: 'components/DragWrapper',
  component: DragWrapper,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    boundary: {
      control: { type: 'select' },
      options: ['window', 'parent'],
      description: 'Defines the boundary for dragging constraints',
    },
    relative: {
      control: { type: 'select' },
      options: ['topLeft', 'topRight'],
      description: 'Position calculation relative to which corner',
    },
    disableDragging: {
      control: { type: 'boolean' },
      description: 'Disable drag functionality',
    },
    isPositionReset: {
      control: { type: 'boolean' },
      description: 'Trigger position reset',
    },
    dragHandleClassName: {
      control: { type: 'text' },
      description: 'CSS class for drag handle elements',
    },
  },
} satisfies Meta<typeof DragWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

function DragHandle({ children }: { children: React.ReactNode }) {
  return (
    <div className="drag-me cursor-move bg-imos-grey/50 p-2 rounded-t border-b border-imos-red/10">
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          <div className="w-1 h-1 bg-imos-white/40 rounded-full"></div>
          <div className="w-1 h-1 bg-imos-white/40 rounded-full"></div>
          <div className="w-1 h-1 bg-imos-white/40 rounded-full"></div>
        </div>
        <span className="text-imos-white/60 text-xs font-medium">{children}</span>
      </div>
    </div>
  );
}

function SimpleCard({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-lg shadow-lg border w-80 bg-imos-grey border-imos-red/20">
      <DragHandle>Drag me around</DragHandle>
      <div className="p-4">
        <h3 className="text-imos-white font-semibold mb-2">{title}</h3>
        <p className="text-imos-white/70 text-sm">{content}</p>
      </div>
    </div>
  );
}

export const Basic: Story = {
  args: {
    boundary: 'window',
    dragHandleClassName: 'drag-me',
    initialPosition: { x: 100, y: 100 },
    disableDragging: false,
    relative: 'topLeft',
  },
  render: args => (
    <DragWrapper {...args}>
      <SimpleCard
        title="Basic Draggable"
        content="A simple draggable component. Drag it around using the handle at the top."
      />
    </DragWrapper>
  ),
};

export const ParentBoundary: Story = {
  args: {
    boundary: 'parent',
    dragHandleClassName: 'drag-me',
    initialPosition: { x: 100, y: 70 },
    disableDragging: false,
    relative: 'topLeft',
  },
  render: args => (
    <div className="w-[700px] h-[600px] border-2 border-dashed border-imos-red/30 bg-imos-white/5 rounded-lg relative">
      <div className="absolute top-2 left-2 text-imos-white/60 text-xs font-medium">
        Parent Container (700×600px)
      </div>
      <DragWrapper {...args}>
        <SimpleCard
          title="Parent Boundary"
          content="Constrained to the parent container — it can't be dragged outside the dashed border."
        />
      </DragWrapper>
    </div>
  ),
};

export const DisabledDragging: Story = {
  args: {
    boundary: 'window',
    dragHandleClassName: 'drag-me',
    initialPosition: { x: 150, y: 100 },
    disableDragging: true,
    relative: 'topLeft',
  },
  render: args => (
    <DragWrapper {...args}>
      <div className={cn('rounded-lg shadow-lg border w-80 bg-imos-grey/50 border-imos-red/10')}>
        <DragHandle>Dragging disabled</DragHandle>
        <div className="p-4">
          <h3 className="text-imos-white/60 font-semibold mb-2">Disabled Dragging</h3>
          <p className="text-imos-white/50 text-sm">
            This component has dragging disabled via the `disableDragging` prop.
          </p>
        </div>
      </div>
    </DragWrapper>
  ),
};
