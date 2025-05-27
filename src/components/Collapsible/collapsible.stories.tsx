import type { Meta, StoryObj } from '@storybook/react';
import { CollapsibleComponent } from '../Collapsible';
import { useToggle } from '@/hooks/useToggle';
import { Button } from '../Button';
import { ArrowDownIcon } from '../Icons';
import clsx from 'clsx';

const meta: Meta<typeof CollapsibleComponent> = {
  title: 'components/CollapsibleComponent',
  component: CollapsibleComponent,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    direction: {
      control: { type: 'radio' },
      options: ['down', 'up'],
    },
    maxHeight: {
      control: { type: 'number' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Sample content for demonstrations
const SAMPLE_CONTENT = (
  <div className="p-4">
    <p className="text-imos-white leading-relaxed">
      Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dicta nobis maiores numquam
      voluptatum tenetur impedit architecto cum? Aperiam eveniet quasi animi adipisci quae
      distinctio nemo reiciendis omnis laborum, maxime accusamus nulla dolorum doloremque
      consequatur odit eaque quidem esse quibusdam numquam, soluta quos nisi. Debitis quisquam
      consectetur ipsa laudantium tempore molestias, illum nesciunt. Odit veniam, placeat accusamus
      nesciunt laboriosam doloribus magni doloremque molestias? Minima tempore exercitationem
      quaerat.
    </p>
  </div>
);

// Reusable trigger component
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
        className={clsx(
          'transition-transform duration-300 ease-in-out',
          shouldRotate && 'rotate-180',
        )}
      />
    </Button>
  );
};

// Story container wrapper
const StoryContainer = ({
  children,
  position = 'top-left',
}: {
  children: React.ReactNode;
  position?: 'top-left' | 'bottom-left';
}) => (
  <div className="w-full min-h-screen bg-slate-100 relative p-8">
    <div
      className={clsx(
        'absolute',
        position === 'top-left' && 'top-8 left-8',
        position === 'bottom-left' && 'bottom-8 left-8',
      )}
    >
      {children}
    </div>
  </div>
);

export const Downwards: Story = {
  args: {
    open: true,
    maxHeight: 400,
    direction: 'down',
    wrapperClassName: 'bg-imos-grey rounded-lg shadow-lg w-80',
    children: SAMPLE_CONTENT,
  },
  render: args => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { open, toggle } = useToggle(args.open);

    return (
      <StoryContainer position="top-left">
        <CollapsibleComponent
          {...args}
          open={open}
          trigger={<CollapsibleTrigger open={open} onToggle={toggle} direction="down" />}
        >
          {args.children}
        </CollapsibleComponent>
      </StoryContainer>
    );
  },
};

export const Upwards: Story = {
  args: {
    open: true,
    maxHeight: 400,
    direction: 'up',
    wrapperClassName: 'bg-imos-grey rounded-lg shadow-lg w-80',
    children: SAMPLE_CONTENT,
  },
  render: args => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { open, toggle } = useToggle(args.open);

    return (
      <StoryContainer position="bottom-left">
        <CollapsibleComponent
          {...args}
          open={open}
          trigger={<CollapsibleTrigger open={open} onToggle={toggle} direction="up" />}
        >
          {args.children}
        </CollapsibleComponent>
      </StoryContainer>
    );
  },
};

export const CustomMaxHeight: Story = {
  args: {
    open: false,
    maxHeight: 200,
    direction: 'down',
    wrapperClassName: 'bg-imos-grey rounded-lg shadow-lg w-80',
    children: SAMPLE_CONTENT,
  },
  render: args => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { open, toggle } = useToggle(args.open);

    return (
      <StoryContainer>
        <CollapsibleComponent
          {...args}
          open={open}
          trigger={
            <div className="p-3 border-b border-imos-white/20">
              <div className="flex items-center justify-between">
                <span className="text-imos-white font-medium">Limited Height Content</span>
                <CollapsibleTrigger open={open} onToggle={toggle} direction="down" />
              </div>
            </div>
          }
        >
          {args.children}
        </CollapsibleComponent>
        <div className="mt-4 p-3 bg-yellow-100 rounded text-sm text-yellow-800">
          <strong>Note:</strong> This example has maxHeight set to 200px to demonstrate scrollable
          content behavior.
        </div>
      </StoryContainer>
    );
  },
};

export const Interactive: Story = {
  args: {
    open: false,
    maxHeight: 600,
    direction: 'down',
    wrapperClassName: 'bg-imos-grey rounded-lg shadow-lg w-96',
  },
  render: args => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { open, toggle } = useToggle(args.open);

    return (
      <StoryContainer>
        <CollapsibleComponent
          {...args}
          open={open}
          trigger={
            <div className="p-4 border-b border-imos-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-imos-white font-semibold">Interactive Demo</h3>
                  <p className="text-imos-white/70 text-sm mt-1">
                    Click to expand and see more content
                  </p>
                </div>
                <CollapsibleTrigger open={open} onToggle={toggle} direction={args.direction} />
              </div>
            </div>
          }
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
      </StoryContainer>
    );
  },
};
