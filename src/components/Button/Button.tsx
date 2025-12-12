import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils';

const buttonVariants = cva(
  "cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-70 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:w-4 [&_svg:not([class*='size-'])]:h-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-blue-500 focus-visible:ring-blue-500/50 focus-visible:ring-4 [&[aria-invalid='true']]:ring-red-500/20 [&[aria-invalid='true']]:border-red-500",
  {
    variants: {
      variant: {
        default: 'bg-blue-600 text-white shadow-sm hover:bg-blue-700',
        destructive:
          'bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:ring-red-500/20',
        outline: 'border border-gray-200 bg-white shadow-sm hover:bg-gray-50 hover:text-gray-900',
        secondary: 'bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-200',
        ghost: 'hover:bg-gray-100 hover:text-gray-900',
        link: 'text-blue-600 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 [&:has(>svg)]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 [&:has(>svg)]:px-2.5',
        lg: 'h-10 rounded-md px-6 [&:has(>svg)]:px-4',
        icon: 'w-fit h-fit',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

const activeBgByVariant: Record<string, string> = {
  default: 'bg-blue-700',
  destructive: 'bg-red-700',
  outline: 'bg-gray-50',
  secondary: 'bg-gray-200',
  ghost: 'bg-gray-100',
  link: '',
};

export function Button({
  className,
  variant,
  size,
  asChild = false,
  isActive = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    isActive?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';
  const activeClass = isActive ? activeBgByVariant[variant || 'default'] : '';
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), activeClass, className)}
      {...props}
    />
  );
}
