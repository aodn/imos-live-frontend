// Toast.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { action } from '@storybook/addon-actions';
import { Heart, Star, Zap } from 'lucide-react';
import { ToastData } from './Toast';
import { ToastProvider } from './ToastProvider';
import { useToast } from './useToast';

// Wrapper component for stories that need the provider
const ToastWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ToastProvider>{children}</ToastProvider>
);

// Story component for interactive demos
const ToastStory: React.FC<{ toastConfig: Omit<ToastData, 'id'> }> = ({ toastConfig }) => {
  const { showToast, hideAllToasts } = useToast();

  const handleShowToast = () => {
    showToast({
      ...toastConfig,
      onClose: action('toast-closed'),
      onClick: toastConfig.onClick ? action('toast-clicked') : undefined,
    });
  };

  return (
    <div className="p-8 space-y-4">
      <div className="flex gap-4">
        <button
          onClick={handleShowToast}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Show Toast
        </button>
        <button
          onClick={hideAllToasts}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Clear All
        </button>
      </div>
      <div className="text-sm text-gray-600">
        <p>Click "Show Toast" to see the toast notification.</p>
        <p>The toast will appear in the configured position.</p>
      </div>
    </div>
  );
};

// Multiple toasts demo
const MultipleToastsStory: React.FC = () => {
  const { showToast, hideAllToasts } = useToast();

  const showMultipleToasts = () => {
    const positions: ToastData['position'][] = [
      'top-left',
      'top-center',
      'top-right',
      'bottom-left',
      'bottom-center',
      'bottom-right',
    ];

    const types: ToastData['type'][] = ['success', 'error', 'warning', 'info'];

    positions.forEach((position, index) => {
      setTimeout(() => {
        showToast({
          type: types[index % types.length],
          title: `${position} Toast`,
          message: `This toast is positioned at ${position}`,
          position,
          duration: 8000,
        });
      }, index * 200);
    });
  };

  return (
    <div className="p-8 space-y-4">
      <div className="flex gap-4">
        <button
          onClick={showMultipleToasts}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          Show All Positions
        </button>
        <button
          onClick={hideAllToasts}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Clear All
        </button>
      </div>
      <div className="text-sm text-gray-600">
        <p>Click "Show All Positions" to see toasts in all 6 positions simultaneously.</p>
      </div>
    </div>
  );
};

// Meta configuration
const meta: Meta = {
  title: 'Components/Toast',
  component: ToastStory,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A highly customizable toast notification system with global state management.',
      },
    },
  },
  decorators: [
    Story => (
      <ToastWrapper>
        <Story />
      </ToastWrapper>
    ),
  ],
  argTypes: {
    toastConfig: {
      control: { type: 'object' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ToastStory>;

// Basic toast types
export const Success: Story = {
  args: {
    toastConfig: {
      type: 'success',
      title: 'Success!',
      message: 'Your action was completed successfully.',
      position: 'top-right',
      duration: 5000,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'A success toast with green styling and check icon.',
      },
    },
  },
};

export const Error: Story = {
  args: {
    toastConfig: {
      type: 'error',
      title: 'Error occurred',
      message: 'Something went wrong. Please try again later.',
      position: 'top-right',
      duration: 6000,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'An error toast with red styling and alert icon.',
      },
    },
  },
};

export const Warning: Story = {
  args: {
    toastConfig: {
      type: 'warning',
      title: 'Warning',
      message: 'Please review your settings before proceeding.',
      position: 'top-right',
      duration: 5000,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'A warning toast with yellow styling and triangle icon.',
      },
    },
  },
};

export const Info: Story = {
  args: {
    toastConfig: {
      type: 'info',
      title: 'Information',
      message: 'Here is some useful information for you.',
      position: 'top-right',
      duration: 5000,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'An info toast with blue styling and info icon.',
      },
    },
  },
};

// Positioning stories
export const TopLeft: Story = {
  args: {
    toastConfig: {
      type: 'info',
      title: 'Top Left',
      message: 'This toast appears in the top-left corner.',
      position: 'top-left',
      duration: 5000,
    },
  },
};

export const TopCenter: Story = {
  args: {
    toastConfig: {
      type: 'info',
      title: 'Top Center',
      message: 'This toast appears in the top-center.',
      position: 'top-center',
      duration: 5000,
    },
  },
};

export const BottomRight: Story = {
  args: {
    toastConfig: {
      type: 'success',
      title: 'Bottom Right',
      message: 'This toast appears in the bottom-right corner.',
      position: 'bottom-right',
      duration: 5000,
    },
  },
};

// Customization stories
export const WithoutTitle: Story = {
  args: {
    toastConfig: {
      type: 'info',
      message: 'This toast has no title, just a message.',
      position: 'top-right',
      duration: 5000,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'A toast with only a message, no title.',
      },
    },
  },
};

export const CustomStyling: Story = {
  args: {
    toastConfig: {
      message: 'This toast has custom purple styling!',
      position: 'top-center',
      duration: 5000,
      className: 'bg-purple-100 border-purple-300 text-purple-900',
      iconClassName: 'text-purple-600',
      renderIcon: () => <Star className="w-5 h-5" />,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'A toast with custom purple styling and star icon.',
      },
    },
  },
};

export const CustomIcon: Story = {
  args: {
    toastConfig: {
      type: 'success',
      title: 'Custom Icon',
      message: 'This toast uses a custom heart icon.',
      position: 'top-right',
      duration: 5000,
      renderIcon: () => <Heart className="w-5 h-5 text-pink-500" />,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'A toast with a custom heart icon instead of the default success icon.',
      },
    },
  },
};

export const Persistent: Story = {
  args: {
    toastConfig: {
      type: 'warning',
      title: 'Persistent Toast',
      message: 'This toast will not auto-dismiss. Click the X to close it.',
      position: 'top-right',
      persistent: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'A persistent toast that stays visible until manually closed.',
      },
    },
  },
};

export const NotClosable: Story = {
  args: {
    toastConfig: {
      type: 'info',
      title: 'No Close Button',
      message: 'This toast cannot be manually closed and will auto-dismiss.',
      position: 'top-right',
      duration: 8000,
      closable: false,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'A toast without a close button that only auto-dismisses.',
      },
    },
  },
};

export const Clickable: Story = {
  args: {
    toastConfig: {
      type: 'info',
      title: 'Clickable Toast',
      message: 'Click anywhere on this toast to trigger an action.',
      position: 'top-right',
      duration: 8000,
      onClick: () => alert('Toast clicked!'),
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'A clickable toast that triggers an action when clicked.',
      },
    },
  },
};

export const LongContent: Story = {
  args: {
    toastConfig: {
      type: 'info',
      title: 'Toast with Long Content',
      message:
        'This is a toast with a much longer message to demonstrate how the component handles text wrapping and maintains good readability even with extended content. The toast should expand to accommodate the content while maintaining its maximum width constraints.',
      position: 'top-right',
      duration: 10000,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'A toast with long content to test text wrapping and layout.',
      },
    },
  },
};

export const QuickDismiss: Story = {
  args: {
    toastConfig: {
      type: 'success',
      title: 'Quick Toast',
      message: 'This toast dismisses quickly!',
      position: 'top-right',
      duration: 1000,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'A toast that auto-dismisses after just 1 second.',
      },
    },
  },
};

export const CustomCloseButton: Story = {
  args: {
    toastConfig: {
      type: 'info',
      title: 'Custom Close Button',
      message: 'This toast has a custom close button.',
      position: 'top-right',
      duration: 8000,
      renderCloseButton: () => <Zap className="w-4 h-4" />,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'A toast with a custom lightning bolt close button.',
      },
    },
  },
};

// Complex scenarios
export const MultiplePositions: StoryObj<typeof MultipleToastsStory> = {
  render: () => <MultipleToastsStory />,
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates toasts appearing in all 6 possible positions simultaneously.',
      },
    },
  },
};

export const AnimationShowcase: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { showToast, hideAllToasts } = useToast();

    const showAnimatedSequence = () => {
      const toasts = [
        { type: 'info' as const, message: 'Starting animation sequence...', icon: '🚀' },
        { type: 'warning' as const, message: 'Processing your request...', icon: '⚡' },
        { type: 'success' as const, message: 'Animation complete!', icon: '✨' },
      ];

      toasts.forEach((toast, index) => {
        setTimeout(() => {
          showToast({
            type: toast.type,
            message: toast.message,
            position: 'top-center',
            duration: 3000,
            renderIcon: () => <span className="text-xl">{toast.icon}</span>,
          });
        }, index * 1000);
      });
    };

    return (
      <div className="p-8 space-y-4">
        <div className="flex gap-4">
          <button
            onClick={showAnimatedSequence}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
          >
            Show Animation Sequence
          </button>
          <button
            onClick={hideAllToasts}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Clear All
          </button>
        </div>
        <div className="text-sm text-gray-600">
          <p>Shows a sequence of toasts with custom emoji icons and smooth transitions.</p>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'A sequence of animated toasts showing the smooth transition effects.',
      },
    },
  },
};

// Playground story for testing
export const Playground: Story = {
  args: {
    toastConfig: {
      type: 'info',
      title: 'Playground Toast',
      message: 'Customize this toast using the controls below!',
      position: 'top-right',
      duration: 5000,
      closable: true,
      persistent: false,
    },
  },
  argTypes: {
    'toastConfig.type': {
      control: { type: 'select' },
      options: ['success', 'error', 'warning', 'info'],
    },
    'toastConfig.position': {
      control: { type: 'select' },
      options: [
        'top-left',
        'top-center',
        'top-right',
        'bottom-left',
        'bottom-center',
        'bottom-right',
      ],
    },
    'toastConfig.duration': {
      control: { type: 'number', min: 1000, max: 10000, step: 1000 },
    },
    'toastConfig.title': {
      control: { type: 'text' },
    },
    'toastConfig.message': {
      control: { type: 'text' },
    },
    'toastConfig.closable': {
      control: { type: 'boolean' },
    },
    'toastConfig.persistent': {
      control: { type: 'boolean' },
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive playground to test different toast configurations. Use the controls panel to customize the toast properties.',
      },
    },
  },
};
