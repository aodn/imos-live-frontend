import type { Meta, StoryObj } from '@storybook/react';
import { CollapsibleComponent, TriggerArgs } from '../Collapsible';
import { Button } from '../Button';
import { ArrowDownIcon } from '../Icons';
import clsx from 'clsx';

const meta: Meta<typeof CollapsibleComponent> = {
  title: 'components/Collapsible',
  component: CollapsibleComponent,
  parameters: {
    layout: 'centered',
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

const CollapsibleTrigger = ({
  open,
  toggle,
  direction = 'down',
  toggleIconHidden = false,
}: TriggerArgs) => {
  const shouldRotate = direction === 'down' ? open : !open;
  return (
    <div className="p-4 border-b border-imos-white/20">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-imos-white font-semibold">Interactive Demo</h3>
          <p className="text-imos-white/70 text-sm mt-1">Click to expand and see more content</p>
        </div>
        {!toggleIconHidden && (
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-transparent focus:ring-2 focus:ring-imos-white/20"
            onClick={toggle}
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
        )}
      </div>
    </div>
  );
};

const TriggerContent = () => (
  <div className="p-4 space-y-4">
    <div className="text-imos-white">
      <h4 className="font-medium mb-2">Expanded Content</h4>
      <p className="text-sm leading-relaxed mb-4">
        This is additional content that becomes visible when the collapsible is expanded. You can
        include any type of content here.
      </p>
      <div className="bg-imos-white/10 rounded p-3">
        <p className="text-xs text-imos-white/80">
          Status: <span className="text-green-400">Expanded</span>
        </p>
      </div>
    </div>
  </div>
);

export const Collapsible: Story = {
  args: {
    open: false,
    maxHeight: 600,
    direction: 'down',
    wrapperClassName: 'bg-imos-grey rounded-lg shadow-lg w-96',
    disable: false,
    defaultOpen: true,
    toggleIconHidden: false,
    trigger: ({ toggle, open, direction, toggleIconHidden }: TriggerArgs) => (
      <CollapsibleTrigger
        open={open}
        toggle={toggle}
        direction={direction}
        toggleIconHidden={toggleIconHidden}
      />
    ),
    children: <TriggerContent />,
  },
};

export const Uncollapsible: Story = {
  args: {
    open: false,
    maxHeight: 600,
    direction: 'down',
    wrapperClassName: 'bg-imos-grey rounded-lg shadow-lg w-96',
    disable: true,
    defaultOpen: true,
    toggleIconHidden: true,
    trigger: ({ toggle, open, direction, toggleIconHidden }: TriggerArgs) => (
      <CollapsibleTrigger
        open={open}
        toggle={toggle}
        direction={direction}
        toggleIconHidden={toggleIconHidden}
      />
    ),
    children: <TriggerContent />,
  },
};
