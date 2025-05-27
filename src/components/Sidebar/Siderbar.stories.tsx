import type { Meta, StoryObj } from '@storybook/react';
import { CloseIcon, MenuIcon } from '../Icons';

import { Sidebar } from './Sidebar';
const meta = {
  title: 'components/Sidebar',
  component: Sidebar,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    width: 300,
    sidebarContent: (
      <div>
        <p>Lorem ipsum dolor sit amet</p>
      </div>
    ),
    children: (
      <div className="w-full h-full bg-gray-200">
        <h1 className="text-2xl font-bold mb-4 text-center">main area</h1>
        <div className="w-full flex items-center justify-center">
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Ea sint cupiditate quos dicta
          voluptate eius saepe nostrum possimus minima quod! Officia dolorum accusantium, magni
          eligendi asperiores autem dolor aut eaque molestiae modi dignissimos mollitia, placeat in
          corrupti! Facilis exercitationem ratione accusamus perferendis blanditiis suscipit
          reprehenderit quaerat delectus est deserunt! Perferendis at minus voluptates accusamus,
          tempore delectus quae, nobis provident reprehenderit natus voluptatum. Eum recusandae
          dolores eos doloribus, illum dolore deleniti aliquid eaque laborum saepe, similique harum!
          Quod itaque, est culpa fugiat repellendus dignissimos beatae veniam blanditiis reiciendis
          officia ipsum vel, qui commodi consequatur modi nostrum! Alias enim sint voluptates.
          Atque!
        </div>
      </div>
    ),
    defaultOpen: true,
    openButtonClassName: 'bg-red-500',
    closeButtonClassName: 'bg-red-500',
    openButtonContent: <MenuIcon color="imos-white" />,
    closeButtonContent: <CloseIcon color="imos-white" />,
    onOpen: () => console.log('Sidebar opened'),
    onClose: () => console.log('Sidebar closed'),
  },
};
