/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable jsx-a11y/anchor-is-valid */
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';
import { ChevronRight, Download, Heart, Plus, Settings, Trash2 } from 'lucide-react';
import { useState } from 'react';

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A versatile button component with multiple variants, sizes, and states. Built with Radix UI Slot for composition and class-variance-authority for variant management.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'The visual style variant of the button',
    },
    size: {
      control: { type: 'select' },
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'The size of the button',
    },
    isActive: {
      control: { type: 'boolean' },
      description: 'Whether the button is in an active state',
    },
    asChild: {
      control: { type: 'boolean' },
      description: 'Whether to render as a child component using Radix Slot',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the button is disabled',
    },
    children: {
      control: { type: 'text' },
      description: 'The content of the button',
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic Stories
export const Default: Story = {
  args: {
    children: 'Button',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Button',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Button',
  },
};

export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Link Button',
  },
};

// Size Variants
export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small Button',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large Button',
  },
};

export const Icon: Story = {
  args: {
    size: 'icon',
    children: <Settings />,
  },
};

// State Variants
export const Active: Story = {
  args: {
    isActive: true,
    children: 'Active Button',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled Button',
  },
};

export const DisabledDestructive: Story = {
  args: {
    variant: 'destructive',
    disabled: true,
    children: 'Disabled Delete',
  },
};

// With Icons
export const WithIcon: Story = {
  args: {
    children: (
      <>
        <Download />
        Download
      </>
    ),
  },
};

export const WithIconRight: Story = {
  args: {
    children: (
      <>
        Continue
        <ChevronRight />
      </>
    ),
  },
};

export const IconOnly: Story = {
  args: {
    size: 'icon',
    variant: 'outline',
    children: <Plus />,
  },
  parameters: {
    docs: {
      description: {
        story: 'Icon-only button using the icon size variant',
      },
    },
  },
};

// Complex Examples
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="default">Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All button variants displayed together',
      },
    },
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon">
        <Settings />
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All button sizes displayed together',
      },
    },
  },
};

export const ActiveStates: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button isActive>Default Active</Button>
      <Button variant="destructive" isActive>
        Destructive Active
      </Button>
      <Button variant="outline" isActive>
        Outline Active
      </Button>
      <Button variant="secondary" isActive>
        Secondary Active
      </Button>
      <Button variant="ghost" isActive>
        Ghost Active
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Buttons in their active states',
      },
    },
  },
};

export const WithVariousIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button>
        <Plus /> Add Item
      </Button>
      <Button variant="destructive">
        <Trash2 /> Delete
      </Button>
      <Button variant="outline">
        <Download /> Download
      </Button>
      <Button variant="secondary">
        <Heart /> Favorite
      </Button>
      <Button size="icon" variant="ghost">
        <Settings />
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Buttons with various icons from Lucide React',
      },
    },
  },
};

// Interactive Examples
export const LoadingButton: Story = {
  render: () => {
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = () => {
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 2000);
    };

    return (
      <Button onClick={handleClick} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Click me'}
      </Button>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive example showing a loading state',
      },
    },
  },
};

// AsChild Example
export const AsChildExample: Story = {
  render: () => (
    <Button asChild>
      <a href="#" onClick={e => e.preventDefault()}>
        This is a link styled as a button
      </a>
    </Button>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Using asChild prop to render the button as a different element (link in this case)',
      },
    },
  },
};
