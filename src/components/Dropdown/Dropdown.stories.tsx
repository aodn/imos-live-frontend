import type { Meta, StoryObj } from '@storybook/react';
import { Dropdown } from './Dropdown';
import type { DropdownOption } from './type';
import { User, Mail, Phone, Settings, Heart, Star } from 'lucide-react';

const meta: Meta<typeof Dropdown> = {
  title: 'Components/Dropdown',
  component: Dropdown,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A highly customizable dropdown component with support for:
- Single and multiple selection
- Search functionality
- Custom option rendering
- Various sizes and variants
- Loading and error states
        `,
      },
    },
  },
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Size of the dropdown',
    },
    variant: {
      control: { type: 'select' },
      options: ['default', 'outline', 'ghost'],
      description: 'Visual variant of the dropdown',
    },
    position: {
      control: { type: 'select' },
      options: ['bottom', 'top', 'auto'],
      description: 'Position of the dropdown menu',
    },
    multiple: {
      control: 'boolean',
      description: 'Enable multiple selection',
    },
    searchable: {
      control: 'boolean',
      description: 'Enable search functionality',
    },
    clearable: {
      control: 'boolean',
      description: 'Show clear button when value is selected',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the dropdown',
    },
    loading: {
      control: 'boolean',
      description: 'Show loading spinner',
    },
    required: {
      control: 'boolean',
      description: 'Mark field as required',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Dropdown>;

// Sample data
const basicOptions: DropdownOption[] = [
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2' },
  { value: '3', label: 'Option 3' },
  { value: '4', label: 'Option 4', disabled: true },
  { value: '5', label: 'Option 5' },
];

const optionsWithDescriptions: DropdownOption[] = [
  { value: 'starter', label: 'Starter Plan', description: '$10/month - Basic features' },
  { value: 'pro', label: 'Pro Plan', description: '$25/month - Advanced features' },
  { value: 'enterprise', label: 'Enterprise Plan', description: '$100/month - All features' },
];

const optionsWithIcons: DropdownOption[] = [
  {
    value: 'profile',
    label: 'Profile',
    icon: <User size={16} />,
    description: 'Manage your profile',
  },
  { value: 'mail', label: 'Messages', icon: <Mail size={16} />, description: 'View your messages' },
  { value: 'phone', label: 'Contacts', icon: <Phone size={16} />, description: 'Manage contacts' },
  {
    value: 'settings',
    label: 'Settings',
    icon: <Settings size={16} />,
    description: 'App settings',
  },
  {
    value: 'favorites',
    label: 'Favorites',
    icon: <Heart size={16} />,
    description: 'Your favorites',
  },
  { value: 'starred', label: 'Starred', icon: <Star size={16} />, description: 'Starred items' },
];

const largeOptionSet: DropdownOption[] = Array.from({ length: 50 }, (_, i) => ({
  value: `option-${i + 1}`,
  label: `Option ${i + 1}`,
  description: `This is option number ${i + 1}`,
}));

// Basic Stories
export const Default: Story = {
  args: {
    options: basicOptions,
    placeholder: 'Select an option...',
    onChange: v => console.log(v),
  },
};

export const WithLabel: Story = {
  args: {
    options: basicOptions,
    label: 'Choose Option',
    placeholder: 'Select an option...',
    required: true,
  },
};

export const Multiple: Story = {
  args: {
    options: basicOptions,
    multiple: true,
    placeholder: 'Select multiple options...',
    label: 'Multiple Selection',
  },
};

export const Searchable: Story = {
  args: {
    options: largeOptionSet,
    searchable: true,
    placeholder: 'Search and select...',
    label: 'Searchable Dropdown',
  },
};

export const WithDescriptions: Story = {
  args: {
    options: optionsWithDescriptions,
    placeholder: 'Choose a plan...',
    label: 'Pricing Plans',
  },
};

export const WithIcons: Story = {
  args: {
    options: optionsWithIcons,
    placeholder: 'Select a menu item...',
    label: 'Navigation Menu',
  },
};

export const Clearable: Story = {
  args: {
    options: basicOptions,
    clearable: true,
    initialValue: '2',
    placeholder: 'Select an option...',
    label: 'Clearable Dropdown',
  },
};

// Size Variants
export const SmallSize: Story = {
  args: {
    options: basicOptions,
    size: 'sm',
    placeholder: 'Small dropdown...',
    label: 'Small Size',
  },
};

export const LargeSize: Story = {
  args: {
    options: basicOptions,
    size: 'lg',
    placeholder: 'Large dropdown...',
    label: 'Large Size',
  },
};

// Variant Styles
export const OutlineVariant: Story = {
  args: {
    options: basicOptions,
    variant: 'outline',
    placeholder: 'Outline variant...',
    label: 'Outline Style',
  },
};

export const GhostVariant: Story = {
  args: {
    options: basicOptions,
    variant: 'ghost',
    placeholder: 'Ghost variant...',
    label: 'Ghost Style',
  },
};

// States
export const Loading: Story = {
  args: {
    options: basicOptions,
    loading: true,
    placeholder: 'Loading...',
    label: 'Loading State',
  },
};

export const Disabled: Story = {
  args: {
    options: basicOptions,
    disabled: true,
    placeholder: 'Disabled dropdown...',
    label: 'Disabled State',
  },
};

export const WithError: Story = {
  args: {
    options: basicOptions,
    error: 'This field is required',
    placeholder: 'Select an option...',
    label: 'With Error',
  },
};

// Position Variants
export const TopPosition: Story = {
  render: args => (
    <div style={{ marginTop: '200px', width: '300px' }}>
      <Dropdown {...args} />
    </div>
  ),
  args: {
    options: basicOptions,
    position: 'top',
    placeholder: 'Opens upward...',
    label: 'Top Position',
  },
};
