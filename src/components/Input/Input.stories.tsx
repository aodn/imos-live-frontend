import type { Meta, StoryObj } from '@storybook/react';
import { ConfigIcon, SearchIcon } from '../Icons';
import { Input } from './Input';
import { Button } from '../Button';
import { useState } from 'react';

const meta = {
  title: 'Components/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Search for open data',
    onChange: value => console.log(value),
    wrapperClassName: 'm-4',
    slotSuffix: (
      <div className="flex items-center gap-x-2">
        <Button
          size={'icon'}
          variant={'secondary'}
          className="hover:scale-110 active:scale-110 transition-transform"
        >
          <ConfigIcon color="imos-grey" />
        </Button>

        <Button size={'icon'} className="hover:scale-110 active:scale-110 transition-transform">
          <SearchIcon color="imos-white" />
        </Button>
      </div>
    ),
  },
  render: args => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [state, setState] = useState('');
    return (
      <div>
        <Input {...args} value={state} onChange={v => setState(v)} />
      </div>
    );
  },
};
