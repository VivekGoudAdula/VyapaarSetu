import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Reusable Input component with optional label, error message, and leading/trailing icons.
 * 
 * @param {Object} props
 * @param {string} [props.label] - Field label above input
 * @param {string} [props.helperText] - Supporting guide text
 * @param {string} [props.error] - Validation error message
 * @param {React.ReactNode} [props.leftIcon] - Leading decorative or functional icon
 * @param {React.ReactNode} [props.rightIcon] - Trailing icon or action button
 * @param {string} [props.className] - Extra classes on input element
 * @param {string} [props.containerClassName] - Extra classes on root wrapper
 */
export const Input = React.forwardRef(({
  label,
  helperText,
  error,
  leftIcon,
  rightIcon,
  className,
  containerClassName,
  id,
  disabled,
  required,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={cn('flex flex-col gap-1.5 w-full', containerClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold uppercase tracking-wider text-slate-700 select-none flex items-center justify-between"
        >
          <span>
            {label}
            {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
          </span>
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3 flex items-center pointer-events-none text-slate-400">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          className={cn(
            'h-10 w-full px-3 py-2 bg-white text-slate-900 text-sm rounded-lg border border-slate-200',
            'placeholder:text-slate-400 transition-all duration-150',
            'focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20',
            'disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed',
            leftIcon && 'pl-9',
            rightIcon && 'pr-9',
            error && 'border-red-300 focus:border-red-500 focus:ring-red-500/20 text-red-900',
            className
          )}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-3 flex items-center text-slate-400">
            {rightIcon}
          </div>
        )}
      </div>

      {error ? (
        <p id={`${inputId}-error`} className="text-xs text-red-600 font-medium animate-fadeIn">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${inputId}-helper`} className="text-xs text-slate-500">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';

