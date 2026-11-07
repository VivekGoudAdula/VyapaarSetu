import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Reusable Card container following the $10,000 SaaS light-theme standard.
 */
export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-slate-200/90 shadow-subtle overflow-hidden transition-all',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div
      className={cn('p-5 sm:p-6 border-b border-slate-100 flex flex-col gap-1', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3
      className={cn('text-base sm:text-lg font-semibold text-slate-900 tracking-tight', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }) {
  return (
    <p
      className={cn('text-xs sm:text-sm text-slate-500 leading-relaxed', className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }) {
  return (
    <div className={cn('p-5 sm:p-6', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'p-4 sm:px-6 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between gap-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

