// import type { Meta, StoryObj } from '@storybook/react';
// import { fn } from '@storybook/test';
// import { ImosButton } from './Button';

// const meta = {
//   title: 'ImosButton',
//   component: ImosButton,
//   parameters: {
//     layout: 'centered',
//   },
//   tags: ['autodocs'],
//   argTypes: {},
//   args: { onClick: fn() },
// } satisfies Meta<typeof ImosButton>;

// export default meta;
// type Story = StoryObj<typeof meta>;

// const StartContent = () => {
//   return (
//     <span className="text-red-500">
//       <span className="text-blue-500">start</span>
//     </span>
//   );
// };

// const EndContent = () => {
//   return (
//     <span className="text-red-500">
//       <span className="text-blue-500">end</span>
//     </span>
//   );
// };

// export const Primary: Story = {
//   args: {
//     children: 'Primary',
//     className: 'bg-black text-white',
//     isLoading: false,
//     spinnerPlacement: 'start',
//     fullWidth: false,
//     isDisabled: false,
//     disableRipple: false,
//     startContent: <StartContent />,
//     endContent: <EndContent />,
//   },
// };
