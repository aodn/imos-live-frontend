import type { Meta, StoryObj } from '@storybook/react';
import { CollapsibleComponent } from './collapsible';
import { useToggle } from '@/hooks/useToggle';
import { Button } from './button';
import { ArrowDownIcon } from '../Icons';
import clsx from 'clsx';

const meta = {
  title: 'CollapsibleComponent',
  component: CollapsibleComponent,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CollapsibleComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    open: false,
    trigger: null,
    children: null,
  },
  render: args => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { open, toggle } = useToggle(true);
    return (
      <CollapsibleComponent
        wrapperClassName="bg-imos-grey rounded p-2 w-60"
        {...args}
        trigger={
          <Button variant="ghost" size="icon" className="hover:bg-transparent" onClick={toggle}>
            <ArrowDownIcon
              color="imos-white"
              className={clsx('transition-transform duration-300', open && 'rotate-180')}
            />
          </Button>
        }
        open={open}
        children={
          <div>
            <p className="text-imos-white">
              Lorem ipsum dolor, sit amet consectetur adipisicing elit. Dicta nobis maiores numquam
              voluptatum tenetur impedit architecto cum? Aperiam eveniet quasi animi adipisci quae
              distinctio nemo reiciendis omnis laborum, maxime accusamus nulla dolorum doloremque
              consequatur odit eaque quidem esse quibusdam numquam, soluta quos nisi. Debitis
              quisquam consectetur ipsa laudantium tempore molestias, illum nesciunt. Odit veniam,
              placeat accusamus nesciunt laboriosam doloribus magni doloremque molestias? Minima,
            </p>
          </div>
        }
      />
    );
  },
};
