import type { Meta, StoryObj } from '@storybook/react';
import { ImosDragWrapper } from './ImosDragWrapper';
import { cn } from '@/lib/utils';
import { CollapsibleComponent } from '../Collapsible';
import { useToggle } from '@/hooks';
import { Button } from '../Button';
import { ArrowDownIcon } from '../Icons';

const meta = {
  title: 'components/DragWrapper/ImosDragWrapper',
  component: ImosDragWrapper,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ImosDragWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

const CollapsibleTrigger = ({
  open,
  onToggle,
  direction = 'down',
}: {
  open: boolean;
  onToggle: () => void;
  direction?: 'up' | 'down';
}) => {
  const shouldRotate = direction === 'down' ? open : !open;
  return (
    <div className="p-4 border-b border-imos-white/20 drag-me">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-imos-white font-semibold">Interactive Demo</h3>
          <p className="text-imos-white/70 text-sm mt-1">Click to expand and see more content</p>
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

export const WindowBoundary: Story = {
  render: args => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { open, toggle } = useToggle(false);

    return (
      <ImosDragWrapper
        {...args}
        boundary="window"
        dragHandleClassName="drag-me"
        initialPosition={{ x: 10, y: 90 }}
        disableDragging={false}
      >
        <CollapsibleComponent
          maxHeight={600}
          direction={'down'}
          wrapperClassName="bg-imos-grey rounded-lg shadow-lg w-96"
          open={open}
          trigger={<CollapsibleTrigger open={open} onToggle={toggle} direction={'down'} />}
        >
          <div className="p-4 space-y-4">
            <div className="text-imos-white">
              <h4 className="font-medium mb-2">Expanded Content</h4>
              <p className="text-sm leading-relaxed mb-4">
                This is additional content that becomes visible when the collapsible is expanded.
                You can include any type of content here.
              </p>
              <div className="bg-imos-white/10 rounded p-3">
                <p className="text-xs text-imos-white/80">
                  Status: <span className="text-green-400">Expanded</span>
                </p>
              </div>
            </div>
          </div>
        </CollapsibleComponent>
      </ImosDragWrapper>
    );
  },
};

export const ParentBoundary: Story = {
  render: args => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { open, toggle } = useToggle(false);

    return (
      <div className="w-100 h-100 border overflow-hidden">
        <ImosDragWrapper
          {...args}
          boundary="parent"
          dragHandleClassName="drag-me"
          initialPosition={{ x: 10, y: 90 }}
          disableDragging={false}
        >
          <CollapsibleComponent
            maxHeight={600}
            direction={'down'}
            wrapperClassName="bg-imos-grey rounded-lg shadow-lg w-96"
            open={open}
            trigger={<CollapsibleTrigger open={open} onToggle={toggle} direction={'down'} />}
          >
            <div className="p-4 space-y-4">
              <div className="text-imos-white">
                <h4 className="font-medium mb-2">Expanded Content</h4>
                <p className="text-sm leading-relaxed mb-4">
                  This is additional content that becomes visible when the collapsible is expanded.
                  You can include any type of content here.
                </p>
                <div className="bg-imos-white/10 rounded p-3">
                  <p className="text-xs text-imos-white/80">
                    Status: <span className="text-green-400">Expanded</span>
                  </p>
                </div>
              </div>
            </div>
          </CollapsibleComponent>
        </ImosDragWrapper>
      </div>
    );
  },
};
