import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Reusable horizontal or vertical separator line.
 */
export function Separator({
  orientation = 'horizontal',
  className,
  ...props
}) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        'shrink-0 bg-slate-200',
        orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
        className
      )}
      {...props}
    />
  );
}

