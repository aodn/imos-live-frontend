import type { Meta, StoryObj } from '@storybook/react';
import { DragWrapper } from './DragWrapper';
import { cn } from '@/lib/utils';
import { CollapsibleComponent } from '../Collapsible';
import { useToggle } from '@/hooks';
import { Button } from '../Button';
import { ArrowDownIcon } from '../Icons';
import { useState } from 'react';

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

const CollapsibleTrigger = ({
  open,
  onToggle,
  direction = 'down',
  title = 'Interactive Demo',
  subtitle = 'Click to expand and see more content',
}: {
  open: boolean;
  onToggle: () => void;
  direction?: 'up' | 'down';
  title?: string;
  subtitle?: string;
}) => {
  const shouldRotate = direction === 'down' ? open : !open;
  return (
    <div className=" border-b border-imos-red/20 drag-me cursor-move">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-imos-white font-semibold">{title}</h3>
          <p className="text-imos-white/70 text-sm mt-1">{subtitle}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-transparent focus:ring-2 focus:ring-imos-white/20"
          onClick={onToggle}
          aria-expanded={open}
          aria-label={`${open ? 'Collapse' : 'Expand'} content`}
        >
          <ArrowDownIcon
            color="imos-white"
            className={cn(
              'transition-transform duration-300 ease-in-out',
              shouldRotate && 'rotate-180',
            )}
          />
        </Button>
      </div>
    </div>
  );
};

const DragHandle = ({ children }: { children: React.ReactNode }) => (
  <div className="drag-me cursor-move bg-imos-grey/50 p-2 rounded-t border-b border-imos-red/10">
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        <div className="w-1 h-1 bg-imos-white/40 rounded-full"></div>
        <div className="w-1 h-1 bg-imos-white/40 rounded-full"></div>
        <div className="w-1 h-1 bg-imos-white/40 rounded-full"></div>
        <div className="w-1 h-1 bg-imos-white/40 rounded-full"></div>
        <div className="w-1 h-1 bg-imos-white/40 rounded-full"></div>
        <div className="w-1 h-1 bg-imos-white/40 rounded-full"></div>
      </div>
      <span className="text-imos-white/60 text-xs font-medium">{children}</span>
    </div>
  </div>
);

const SimpleCard = ({
  title,
  content,
  variant = 'default',
  width = 'w-80',
}: {
  title: string;
  content: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
  width?: string;
}) => {
  const variants = {
    default: 'bg-imos-grey border-imos-red/20',
    success: 'bg-green-900/20 border-green-500/30',
    warning: 'bg-yellow-900/20 border-yellow-500/30',
    error: 'bg-red-900/20 border-red-500/30',
  };

  return (
    <div className={cn('rounded-lg shadow-lg border', width, variants[variant])}>
      <DragHandle>Drag me around</DragHandle>
      <div className="p-4">
        <h3 className="text-imos-white font-semibold mb-2">{title}</h3>
        <p className="text-imos-white/70 text-sm">{content}</p>
      </div>
    </div>
  );
};

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
        content="This is a simple draggable component. Try dragging it around using the handle at the top!"
      />
    </DragWrapper>
  ),
};

export const WindowBoundary: Story = {
  args: {
    boundary: 'window',
    dragHandleClassName: 'drag-me',
    initialPosition: { x: 50, y: 290 },
    disableDragging: false,
    relative: 'topLeft',
  },
  render: args => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { open, toggle } = useToggle(false);

    return (
      <DragWrapper {...args}>
        <CollapsibleComponent
          maxHeight={600}
          direction={'down'}
          wrapperClassName="bg-imos-grey rounded-lg shadow-lg w-96"
          open={open}
          trigger={
            <CollapsibleTrigger
              open={open}
              onToggle={toggle}
              direction={'down'}
              title="Window Boundary Demo"
              subtitle="Constrained to window boundaries"
            />
          }
        >
          <div className="p-4 space-y-4">
            <div className="text-imos-white">
              <h4 className="font-medium mb-2">Expanded Content</h4>
              <p className="text-sm leading-relaxed mb-4">
                This component is constrained to the window boundaries. Try dragging it to the edges
                of the viewport to see how it respects the boundaries.
              </p>
              <div className="bg-imos-white/10 rounded p-3">
                <p className="text-xs text-imos-white/80">
                  Boundary: <span className="text-blue-400">Window</span>
                </p>
                <p className="text-xs text-imos-white/80">
                  Status: <span className="text-green-400">Expanded</span>
                </p>
              </div>
            </div>
          </div>
        </CollapsibleComponent>
      </DragWrapper>
    );
  },
};

export const ParentBoundary: Story = {
  args: {
    boundary: 'parent',
    dragHandleClassName: 'drag-me',
    initialPosition: { x: 100, y: 70 },
    disableDragging: false,
    relative: 'topRight',
  },
  render: args => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { open, toggle } = useToggle(false);

    return (
      <div className="w-[700px] h-[600px] border-2 border-dashed border-imos-red/30 bg-imos-white/5 rounded-lg  relative">
        <div className="absolute top-2 left-2 text-imos-white/60 text-xs font-medium">
          Parent Container (700×600px)
        </div>
        <DragWrapper {...args}>
          <CollapsibleComponent
            maxHeight={600}
            direction={'down'}
            wrapperClassName="bg-imos-grey rounded-lg shadow-lg w-96 border border-imos-red/20"
            open={open}
            trigger={
              <CollapsibleTrigger
                open={open}
                onToggle={toggle}
                direction={'down'}
                title="Parent Boundary Demo"
                subtitle="Positioned from top-right, constrained to parent"
              />
            }
          >
            <div className="p-4 space-y-4">
              <div className="text-imos-white">
                <h4 className="font-medium mb-2">Expanded Content</h4>
                <p className="text-sm leading-relaxed mb-4">
                  This component is constrained to its parent container and positioned relative to
                  the top-right corner. Notice how it can't be dragged outside the dashed border.
                </p>
                <div className="bg-imos-white/10 rounded p-3 space-y-1">
                  <p className="text-xs text-imos-white/80">
                    Boundary: <span className="text-purple-400">Parent</span>
                  </p>
                  <p className="text-xs text-imos-white/80">
                    Relative: <span className="text-orange-400">Top-Right</span>
                  </p>
                  <p className="text-xs text-imos-white/80">
                    Status: <span className="text-green-400">Expanded</span>
                  </p>
                </div>
              </div>
            </div>
          </CollapsibleComponent>
        </DragWrapper>
      </div>
    );
  },
};

export const MultipleCards: Story = {
  args: {
    boundary: 'window',
    dragHandleClassName: 'drag-me',
    disableDragging: false,
    relative: 'topLeft',
  },
  render: args => (
    <div>
      <DragWrapper {...args} initialPosition={{ x: 50, y: 50 }}>
        <SimpleCard
          title="Card 1"
          content="This is the first draggable card. Each card can be moved independently."
          variant="success"
          width="w-72"
        />
      </DragWrapper>

      <DragWrapper {...args} initialPosition={{ x: 400, y: 100 }}>
        <SimpleCard
          title="Card 2"
          content="This is the second draggable card with a different color scheme."
          variant="warning"
          width="w-72"
        />
      </DragWrapper>

      <DragWrapper {...args} initialPosition={{ x: 200, y: 250 }}>
        <SimpleCard
          title="Card 3"
          content="This is the third draggable card. Try dragging all three around!"
          variant="error"
          width="w-72"
        />
      </DragWrapper>
    </div>
  ),
};

export const PositionReset: Story = {
  args: {
    boundary: 'window',
    dragHandleClassName: 'drag-me',
    initialPosition: { x: 200, y: 150 },
    disableDragging: false,
    relative: 'topLeft',
  },
  render: args => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [isReset, setIsReset] = useState(false);

    const handleReset = () => {
      setIsReset(true);
      setTimeout(() => setIsReset(false), 100);
    };

    return (
      <div>
        <div className="fixed top-4 right-4 z-50">
          <Button onClick={handleReset} className="bg-blue-600 hover:bg-blue-700 text-white">
            Reset Position
          </Button>
        </div>

        <DragWrapper {...args} isPositionReset={isReset}>
          <div className="bg-imos-grey rounded-lg shadow-lg w-80 border border-imos-red/20">
            <DragHandle>Position Reset Demo</DragHandle>
            <div className="p-4">
              <h3 className="text-imos-white font-semibold mb-2">Position Reset Demo</h3>
              <p className="text-imos-white/70 text-sm mb-4">
                Drag this card around, then click the "Reset Position" button to return it to its
                initial position.
              </p>
              <div className="bg-imos-white/10 rounded p-3">
                <p className="text-xs text-imos-white/80">
                  Initial Position: <span className="text-cyan-400">x: 200, y: 150</span>
                </p>
              </div>
            </div>
          </div>
        </DragWrapper>
      </div>
    );
  },
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
      <div className="bg-imos-grey/50 rounded-lg shadow-lg w-80 border border-imos-red/10 opacity-75">
        <div className="drag-me cursor-not-allowed bg-imos-grey/30 p-2 rounded-t border-b border-imos-red/5">
          <div className="flex items-center gap-2">
            <div className="flex gap-1 opacity-50">
              <div className="w-1 h-1 bg-imos-white/20 rounded-full"></div>
              <div className="w-1 h-1 bg-imos-white/20 rounded-full"></div>
              <div className="w-1 h-1 bg-imos-white/20 rounded-full"></div>
            </div>
            <span className="text-imos-white/40 text-xs font-medium">Dragging Disabled</span>
          </div>
        </div>
        <div className="p-4">
          <h3 className="text-imos-white/60 font-semibold mb-2">Disabled Dragging</h3>
          <p className="text-imos-white/50 text-sm">
            This component has dragging disabled. The cursor shows as "not-allowed" when hovering
            over the drag handle.
          </p>
        </div>
      </div>
    </DragWrapper>
  ),
};

export const TopRightPositioning: Story = {
  args: {
    boundary: 'parent',
    dragHandleClassName: 'drag-me',
    initialPosition: { x: 20, y: 20 },
    disableDragging: false,
    relative: 'topRight',
  },
  render: args => (
    <div className="w-[800px] h-[500px] border-2 border-dashed border-imos-red/30 bg-imos-white/5 rounded-lg  relative">
      <div className="absolute top-2 left-2 text-imos-white/60 text-xs font-medium">
        Parent Container (800×500px)
      </div>
      <div className="absolute top-2 right-2 text-imos-white/60 text-xs font-medium bg-orange-500/20 px-2 py-1 rounded">
        → Top-Right Reference Point
      </div>

      <DragWrapper {...args}>
        <div className="bg-imos-grey rounded-lg shadow-lg w-72 border border-orange-500/30">
          <DragHandle>Top-Right Positioning</DragHandle>
          <div className="p-4">
            <h3 className="text-imos-white font-semibold mb-2">Top-Right Relative</h3>
            <p className="text-imos-white/70 text-sm mb-4">
              This component is positioned relative to the top-right corner of its parent container.
              The initial position is calculated from the right edge.
            </p>
            <div className="bg-orange-500/10 rounded p-3 space-y-1">
              <p className="text-xs text-imos-white/80">
                Offset from right: <span className="text-orange-400">20px</span>
              </p>
              <p className="text-xs text-imos-white/80">
                Offset from top: <span className="text-orange-400">20px</span>
              </p>
            </div>
          </div>
        </div>
      </DragWrapper>
    </div>
  ),
};

export const ResponsiveBehavior: Story = {
  args: {
    boundary: 'parent',
    dragHandleClassName: 'drag-me',
    initialPosition: { x: 50, y: 50 },
    disableDragging: false,
    relative: 'topLeft',
  },
  render: args => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [containerSize, setContainerSize] = useState<'small' | 'medium' | 'large'>('medium');

    const sizes = {
      small: 'w-[400px] h-[300px]',
      medium: 'w-[600px] h-[400px]',
      large: 'w-[800px] h-[600px]',
    };

    return (
      <div>
        <div className="mb-4 flex gap-2">
          <Button
            onClick={() => setContainerSize('small')}
            variant={containerSize === 'small' ? 'default' : 'outline'}
            size="sm"
          >
            Small
          </Button>
          <Button
            onClick={() => setContainerSize('medium')}
            variant={containerSize === 'medium' ? 'default' : 'outline'}
            size="sm"
          >
            Medium
          </Button>
          <Button
            onClick={() => setContainerSize('large')}
            variant={containerSize === 'large' ? 'default' : 'outline'}
            size="sm"
          >
            Large
          </Button>
        </div>

        <div
          className={cn(
            'border-2 border-dashed border-imos-red/30 bg-imos-white/5 rounded-lg  relative transition-all duration-300',
            sizes[containerSize],
          )}
        >
          <div className="absolute top-2 left-2 text-imos-white/60 text-xs font-medium">
            Responsive Container ({containerSize})
          </div>

          <DragWrapper {...args}>
            <div className="bg-imos-grey rounded-lg shadow-lg w-72 border border-imos-red/20">
              <DragHandle>Responsive Demo</DragHandle>
              <div className="p-4">
                <h3 className="text-imos-white font-semibold mb-2">Responsive Behavior</h3>
                <p className="text-imos-white/70 text-sm mb-4">
                  Change the container size using the buttons above. The draggable element
                  automatically adjusts its constraints to the new boundaries.
                </p>
                <div className="bg-imos-white/10 rounded p-3">
                  <p className="text-xs text-imos-white/80">
                    Container: <span className="text-green-400 capitalize">{containerSize}</span>
                  </p>
                </div>
              </div>
            </div>
          </DragWrapper>
        </div>
      </div>
    );
  },
};
