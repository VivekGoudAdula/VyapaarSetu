import React from 'react';
import { cn } from '@/lib/utils';

const BADGE_VARIANTS = {
  default: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
  success: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
  warning: 'bg-amber-50 text-amber-800 border-amber-200/80',
  destructive: 'bg-red-50 text-red-800 border-red-200/80',
  info: 'bg-blue-50 text-blue-800 border-blue-200/80',
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  subtle: 'bg-slate-50 text-slate-600 border-slate-200/60',
};

const DOT_COLORS = {
  default: 'bg-emerald-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  destructive: 'bg-red-500',
  info: 'bg-blue-500',
  neutral: 'bg-slate-400',
  subtle: 'bg-slate-400',
};

/**
 * Reusable Badge primitive for status indicators and metadata tags.
 */
export function Badge({
  variant = 'default',
  showDot = false,
  size = 'default',
  className,
  children,
  ...props
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium border rounded-full select-none tracking-tight',
        size === 'sm' ? 'px-2 py-0.5 text-[11px] gap-1' : 'px-2.5 py-0.5 text-xs gap-1.5',
        BADGE_VARIANTS[variant] || BADGE_VARIANTS.default,
        className
      )}
      {...props}
    >
      {showDot && (
        <span
          className={cn(
            'rounded-full shrink-0',
            size === 'sm' ? 'w-1 h-1' : 'w-1.5 h-1.5',
            DOT_COLORS[variant] || DOT_COLORS.default
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
