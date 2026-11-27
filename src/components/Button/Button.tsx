import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils';

const buttonVariants = cva(
  "cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-btn transition-all disabled:pointer-events-none disabled:opacity-70 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:w-4 [&_svg:not([class*='size-'])]:h-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-primary focus-visible:ring-primary/50 focus-visible:ring-4 [&[aria-invalid='true']]:ring-red-500/20 [&[aria-invalid='true']]:border-red-500 hover:opacity-90",
  {
    variants: {
      variant: {
        default: 'bg-primary text-white shadow-sm',
        destructive: 'bg-danger text-white shadow-sm focus-visible:ring-danger/20',
        outline: 'border border-line bg-white shadow-sm ',
        secondary: 'bg-surface-muted text-ink shadow-sm ',
        ghost: '',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-3 py-[2px] [&:has(>svg)]:px-3',
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
  default: 'bg-primary-dark',
  destructive: 'bg-danger',
  outline: 'bg-surface-muted',
  secondary: 'bg-surface-sunken',
  ghost: 'bg-surface-muted',
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
