import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from './Switch';

const meta: Meta<typeof Switch> = {
  title: 'Components/Switch',
  component: Switch,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A highly customizable switch component with internal state management, built with React, TypeScript, and Tailwind CSS.',
      },
    },
  },
  argTypes: {
    initialValue: {
      control: 'boolean',
      description: 'Initial state of the switch',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the switch is disabled',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Size of the switch',
    },
    variant: {
      control: { type: 'select' },
      options: ['default', 'success', 'warning', 'danger', 'info'],
      description: 'Color variant of the switch',
    },
    label: {
      control: 'text',
      description: 'Label text for the switch',
    },
    description: {
      control: 'text',
      description: 'Description text for the switch',
    },
    labelPosition: {
      control: { type: 'select' },
      options: ['left', 'right'],
      description: 'Position of the label relative to the switch',
    },
    showIcons: {
      control: 'boolean',
      description: 'Whether to show icons in the thumb',
    },
    rounded: {
      control: { type: 'select' },
      options: ['none', 'sm', 'md', 'lg', 'full'],
      description: 'Border radius of the switch',
    },
    onChange: {
      action: 'changed',
      description: 'Callback fired when the switch state changes',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic Stories
export const Default: Story = {
  args: {
    initialValue: false,
  },
};

export const Checked: Story = {
  args: {
    initialValue: true,
  },
};

export const Disabled: Story = {
  args: {
    initialValue: false,
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  args: {
    initialValue: true,
    disabled: true,
  },
};

// Size Variants
export const Small: Story = {
  args: {
    initialValue: true,
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    initialValue: true,
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    initialValue: true,
    size: 'lg',
  },
};

// Color Variants
export const Success: Story = {
  args: {
    initialValue: true,
    variant: 'success',
  },
};

export const Warning: Story = {
  args: {
    initialValue: true,
    variant: 'warning',
  },
};

export const Danger: Story = {
  args: {
    initialValue: true,
    variant: 'danger',
  },
};

export const Info: Story = {
  args: {
    initialValue: true,
    variant: 'info',
  },
};

// With Labels
export const WithLabel: Story = {
  args: {
    initialValue: false,
    label: 'Enable notifications',
    description: 'Get notified when something happens',
  },
};

export const LabelLeft: Story = {
  args: {
    initialValue: true,
    label: 'Dark mode',
    description: 'Switch to dark theme',
    labelPosition: 'left',
  },
};

// Advanced Features
export const WithIcons: Story = {
  args: {
    initialValue: true,
    showIcons: true,
    size: 'lg',
  },
};

export const CustomColors: Story = {
  args: {
    initialValue: true,
    customColors: {
      on: 'bg-purple-600',
      off: 'bg-pink-200',
      thumbOn: 'bg-yellow-400',
    },
  },
};

export const SquareRounded: Story = {
  args: {
    initialValue: true,
    rounded: 'md',
    variant: 'info',
  },
};

// Complex Examples
export const FeatureToggle: Story = {
  args: {
    initialValue: false,
    label: 'Enable Beta Features',
    description: 'Access experimental functionality (may be unstable)',
    variant: 'warning',
    size: 'lg',
    showIcons: true,
  },
};

export const PrivacySettings: Story = {
  args: {
    initialValue: true,
    label: 'Make Profile Public',
    description: 'Allow others to see your profile information',
    variant: 'success',
    labelPosition: 'left',
  },
};
