import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const BUTTON_VARIANTS = {
  primary: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-subtle focus-visible:ring-emerald-500',
  secondary: 'bg-slate-100 hover:bg-slate-200/80 active:bg-slate-200 text-slate-800 focus-visible:ring-slate-400',
  outline: 'bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-200 shadow-subtle focus-visible:ring-emerald-500',
  ghost: 'bg-transparent hover:bg-slate-100/80 active:bg-slate-200 text-slate-600 hover:text-slate-900 focus-visible:ring-slate-400',
  'subtle-emerald': 'bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 border border-emerald-200/60 focus-visible:ring-emerald-500',
  destructive: 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 focus-visible:ring-red-500',
  link: 'text-emerald-600 hover:text-emerald-700 underline-offset-4 hover:underline p-0 h-auto font-normal focus-visible:ring-emerald-500',
};

const BUTTON_SIZES = {
  sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
  default: 'h-9 px-4 py-2 text-sm rounded-lg gap-2',
  lg: 'h-10 px-5 text-sm sm:text-base rounded-lg gap-2.5',
  icon: 'h-9 w-9 p-0 rounded-lg justify-center',
};

/**
 * Reusable Button primitive following the $10,000 SaaS light-theme standard.
 */
export const Button = React.forwardRef(({
  variant = 'primary',
  size = 'default',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled = false,
  className,
  children,
  ...props
}, ref) => {
  const isDisabled = disabled || isLoading;

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none select-none',
        BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.primary,
        BUTTON_SIZES[size] || BUTTON_SIZES.default,
        className
      )}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
      ) : leftIcon ? (
        <span className="shrink-0">{leftIcon}</span>
      ) : null}
      
      {children}

      {!isLoading && rightIcon && (
        <span className="shrink-0">{rightIcon}</span>
      )}
    </button>
  );
});

Button.displayName = 'Button';
