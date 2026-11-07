import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges class names safely with Tailwind CSS precedence.
 * Combines clsx conditional logic with tailwind-merge conflict resolution.
 * 
 * @param {...any} inputs - Class strings, objects, or arrays
 * @returns {string} - Merged className string
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

