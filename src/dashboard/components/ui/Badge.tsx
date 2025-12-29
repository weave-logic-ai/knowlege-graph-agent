/**
 * Badge Component
 *
 * Small status indicator component with multiple variants.
 * Implements shadcn/ui patterns using class-variance-authority.
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  [
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
    'transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  ],
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline:
          'text-foreground',
        success:
          'border-transparent bg-green-500 text-white hover:bg-green-500/80',
        warning:
          'border-transparent bg-yellow-500 text-white hover:bg-yellow-500/80',
      },
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        sm: 'px-2 py-0 text-[10px]',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /** Optional icon to display before text */
  icon?: React.ReactNode;
  /** If true, displays as a dot without text */
  dot?: boolean;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, icon, dot, children, ...props }, ref) => {
    if (dot) {
      return (
        <span
          ref={ref as React.RefObject<HTMLSpanElement>}
          className={cn(
            'inline-flex h-2 w-2 rounded-full',
            variant === 'default' && 'bg-primary',
            variant === 'secondary' && 'bg-secondary',
            variant === 'destructive' && 'bg-destructive',
            variant === 'success' && 'bg-green-500',
            variant === 'warning' && 'bg-yellow-500',
            variant === 'outline' && 'border border-current',
            className
          )}
          {...props}
        />
      );
    }

    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      >
        {icon && <span className="mr-1 -ml-0.5">{icon}</span>}
        {children}
      </div>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge, badgeVariants };
