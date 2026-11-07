import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Reusable Empty State container for honest placeholders without fake data.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 sm:p-10',
        'border border-dashed border-slate-200/90 rounded-xl bg-slate-50/40',
        className
      )}
      {...props}
    >
      {icon && (
        <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center text-slate-500 mb-3.5 shadow-subtle border border-slate-200/70">
          {icon}
        </div>
      )}
      <h4 className="text-sm sm:text-base font-semibold text-slate-900 tracking-tight mb-1">
        {title}
      </h4>
      {description && (
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mb-5 leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <div className="flex items-center gap-3">
          {action}
        </div>
      )}
    </div>
  );
}
