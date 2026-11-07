import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const BUTTON_VARIANTS = {
  primary: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm focus-visible:ring-emerald-500',
  secondary: 'bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 focus-visible:ring-slate-400',
  outline: 'bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm focus-visible:ring-emerald-500',
  ghost: 'bg-transparent hover:bg-slate-100 active:bg-slate-200 text-slate-600 hover:text-slate-900 focus-visible:ring-slate-400',
  destructive: 'bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-700 border border-red-200 focus-visible:ring-red-500',
  link: 'text-emerald-600 hover:text-emerald-700 underline-offset-4 hover:underline p-0 h-auto font-normal focus-visible:ring-emerald-500',
};

const BUTTON_SIZES = {
  sm: 'h-8 px-3 text-xs rounded-md gap-1.5',
  default: 'h-10 px-4 py-2 text-sm rounded-lg gap-2',
  lg: 'h-11 px-6 text-base rounded-lg gap-2.5',
  icon: 'h-9 w-9 p-0 rounded-lg justify-center',
};

/**
 * Reusable Button component harmonizing shadcn/ui and Sera UI patterns.
 * 
 * @param {Object} props
 * @param {'primary'|'secondary'|'outline'|'ghost'|'destructive'|'link'} [props.variant='primary']
 * @param {'sm'|'default'|'lg'|'icon'} [props.size='default']
 * @param {boolean} [props.isLoading=false]
 * @param {React.ReactNode} [props.leftIcon]
 * @param {React.ReactNode} [props.rightIcon]
 * @param {boolean} [props.disabled=false]
 * @param {string} [props.className]
 * @param {React.ReactNode} props.children
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

