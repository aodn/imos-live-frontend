import type { Meta, StoryObj } from '@storybook/react';
import { CollapsibleComponent } from '../Collapsible';
import { Button } from '../Button';
import { ArrowDownIcon } from '../Icons';
import clsx from 'clsx';

const meta: Meta<typeof CollapsibleComponent> = {
  title: 'components/CollapsibleComponent',
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
  onToggle,
  direction = 'down',
}: {
  open: boolean;
  onToggle: () => void;
  direction?: 'up' | 'down';
}) => {
  const shouldRotate = direction === 'down' ? open : !open;
  return (
    <div className="p-4 border-b border-imos-white/20">
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
            className={clsx(
              'transition-transform duration-300 ease-in-out',
              shouldRotate && 'rotate-180',
            )}
          />
        </Button>
      </div>
    </div>
  );
};

export const Interactive: Story = {
  args: {
    open: false,
    maxHeight: 600,
    direction: 'down',
    wrapperClassName: 'bg-imos-grey rounded-lg shadow-lg w-96',
    trigger: ({
      toggle,
      open,
      direction,
    }: {
      toggle: () => void;
      open: boolean;
      direction: 'up' | 'down';
    }) => <CollapsibleTrigger open={open} onToggle={toggle} direction={direction} />,
    children: (
      <div className="p-4 space-y-4">
        <div className="text-imos-white">
          <h4 className="font-medium mb-2">Expanded Content</h4>
          <p className="text-sm leading-relaxed mb-4">
            This is additional content that becomes visible when the collapsible is expanded. You
            can include any type of content here.
          </p>
          <div className="bg-imos-white/10 rounded p-3">
            <p className="text-xs text-imos-white/80">
              Status: <span className="text-green-400">Expanded</span>
            </p>
          </div>
        </div>
      </div>
    ),
  },
  // render: args => {
  //   return (
  //     <CollapsibleComponent
  //       {...args}
  //       trigger={({ toggle, open }) => (
  //         <CollapsibleTrigger open={open} onToggle={toggle} direction={args.direction} />
  //       )}
  //     >
  //       <div className="p-4 space-y-4">
  //         <div className="text-imos-white">
  //           <h4 className="font-medium mb-2">Expanded Content</h4>
  //           <p className="text-sm leading-relaxed mb-4">
  //             This is additional content that becomes visible when the collapsible is expanded. You
  //             can include any type of content here.
  //           </p>
  //           <div className="bg-imos-white/10 rounded p-3">
  //             <p className="text-xs text-imos-white/80">
  //               Status: <span className="text-green-400">Expanded</span>
  //             </p>
  //           </div>
  //         </div>
  //       </div>
  //     </CollapsibleComponent>
  //   );
  // },
};
