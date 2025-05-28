import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { Image } from './Image';

// Define the component metadata
const meta: Meta<typeof Image> = {
  title: 'Components/Image',
  component: Image,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A customizable image component with skeleton loading, error handling, and fallback support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    src: {
      control: 'text',
      description: 'The source URL of the image',
    },
    alt: {
      control: 'text',
      description: 'Alternative text for the image',
    },
    fill: {
      control: 'boolean',
      description: 'image fill parent container',
    },
    containerClassName: {
      control: 'text',
      description: 'CSS classes for the container wrapper',
    },
    imageClassName: {
      control: 'text',
      description: 'CSS classes for the image element',
    },
    skeletonClassName: {
      control: 'text',
      description: 'CSS classes for the skeleton loader',
    },
    showSkeleton: {
      control: 'boolean',
      description: 'Whether to show skeleton loading state',
    },
    skeletonHeight: {
      control: 'select',
      options: ['h-24', 'h-32', 'h-48', 'h-64', 'h-96', 100, 200, 300], // include numbers
      description: 'Height class for the skeleton (Tailwind class or pixel number)',
      table: {
        type: { summary: 'string | number' },
        defaultValue: { summary: 'h-48' },
      },
    },
    skeletonWidth: {
      control: 'select',
      options: ['w-24', 'w-32', 'w-48', 'w-64', 'w-96', 'w-full', 100, 200, 300],
      description: 'Width class for the skeleton (Tailwind class or pixel number)',
      table: {
        type: { summary: 'string | number' },
        defaultValue: { summary: 'w-full' },
      },
    },
    fallbackSrc: {
      control: 'text',
      description: 'Fallback image URL if main image fails to load',
    },
    onLoadStart: {
      action: 'load-start',
      description: 'Callback when image starts loading',
    },
    onLoadComplete: {
      action: 'load-complete',
      description: 'Callback when image finishes loading',
    },
    onError: {
      action: 'error',
      description: 'Callback when image fails to load',
    },
  },
  args: {
    onLoadStart: action('load-start'),
    onLoadComplete: action('load-complete'),
    onError: action('error'),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default story
export const Default: Story = {
  args: {
    src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    alt: 'Beautiful landscape',
    imageClassName: 'w-80 h-48 object-cover',
  },
};

// Fill story
export const Fill: Story = {
  args: {
    src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    alt: 'Beautiful landscape',
    fill: true,
  },
};

// Error state story
export const ErrorState: Story = {
  args: {
    src: 'https://invalid-url-that-will-fail.jpg',
    alt: 'Image that fails to load',
    imageClassName: 'w-80 h-48 object-cover rounded-lg',
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the error state when an image fails to load.',
      },
    },
  },
};

// Avatar/Circular style
export const Avatar: Story = {
  args: {
    src: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
    alt: 'User avatar',
    containerClassName: 'rounded-full overflow-hidden',
    imageClassName: 'w-32 h-32 object-cover',
    skeletonHeight: 'h-32',
    skeletonWidth: 'w-32',
    skeletonClassName: 'h-32 w-32 bg-gray-200 animate-pulse rounded-full',
  },
  parameters: {
    docs: {
      description: {
        story: 'Circular avatar style with custom skeleton to match the rounded shape.',
      },
    },
  },
};

// Custom skeleton style
export const CustomSkeleton: Story = {
  args: {
    src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
    alt: 'Image with custom skeleton',
    imageClassName: 'w-80 h-48 object-cover rounded-lg',
    skeletonClassName:
      'h-48 w-80 bg-gradient-to-r from-purple-200 via-pink-200 to-red-200 animate-pulse rounded-lg',
  },
  parameters: {
    docs: {
      description: {
        story: 'Custom skeleton with gradient background colors instead of the default gray.',
      },
    },
  },
};

// No skeleton
export const NoSkeleton: Story = {
  args: {
    src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    alt: 'Image without skeleton loading',
    imageClassName: 'w-80 h-48 object-cover rounded-lg',
    showSkeleton: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Image component with skeleton loading disabled.',
      },
    },
  },
};

// Small thumbnail
export const Thumbnail: Story = {
  args: {
    src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=150&h=150&fit=crop',
    alt: 'Small thumbnail',
    containerClassName: 'rounded-md overflow-hidden',
    imageClassName: 'w-24 h-24 object-cover',
    skeletonHeight: 'h-24',
    skeletonWidth: 'w-24',
  },
  parameters: {
    docs: {
      description: {
        story: 'Small thumbnail size variant.',
      },
    },
  },
};

// Large hero image
export const HeroImage: Story = {
  args: {
    src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop',
    alt: 'Large hero image',
    containerClassName: 'rounded-xl overflow-hidden shadow-2xl',
    imageClassName: 'w-full h-96 object-cover',
    skeletonHeight: 'h-96',
    skeletonWidth: 'w-full',
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: 'Large hero-style image with enhanced styling.',
      },
    },
  },
};
