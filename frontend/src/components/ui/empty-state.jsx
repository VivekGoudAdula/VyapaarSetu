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
        'flex flex-col items-center justify-center text-center p-8 sm:p-12',
        'border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50',
        className
      )}
      {...props}
    >
      {icon && (
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 mb-4 shadow-sm border border-slate-200">
          {icon}
        </div>
      )}
      <h4 className="text-base font-semibold text-slate-900 tracking-tight mb-1">
        {title}
      </h4>
      {description && (
        <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
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

