/* General utility functions (exposes cn) */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges multiple class names into a single string
 * @param inputs - Array of class names
 * @returns Merged class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Rotating color palette for categorized items (subjects, modules, topics).
 * Each entry provides bg (icon bg), text, badge, border, btn (button bg + hover), hoverBorder.
 */
export const CATEGORY_COLORS = [
  { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', badge: 'bg-blue-500', border: 'border-blue-500/20', btn: 'bg-blue-600 hover:bg-green-600', hoverBorder: 'hover:border-blue-500/40' },
  { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-500', border: 'border-emerald-500/20', btn: 'bg-emerald-600 hover:bg-green-600', hoverBorder: 'hover:border-emerald-500/40' },
  { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', badge: 'bg-purple-500', border: 'border-purple-500/20', btn: 'bg-purple-600 hover:bg-green-600', hoverBorder: 'hover:border-purple-500/40' },
  { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', badge: 'bg-orange-500', border: 'border-orange-500/20', btn: 'bg-orange-600 hover:bg-green-600', hoverBorder: 'hover:border-orange-500/40' },
  { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', badge: 'bg-rose-500', border: 'border-rose-500/20', btn: 'bg-rose-600 hover:bg-green-600', hoverBorder: 'hover:border-rose-500/40' },
  { bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', badge: 'bg-cyan-500', border: 'border-cyan-500/20', btn: 'bg-cyan-600 hover:bg-green-600', hoverBorder: 'hover:border-cyan-500/40' },
  { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', badge: 'bg-amber-500', border: 'border-amber-500/20', btn: 'bg-amber-600 hover:bg-green-600', hoverBorder: 'hover:border-amber-500/40' },
  { bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', badge: 'bg-indigo-500', border: 'border-indigo-500/20', btn: 'bg-indigo-600 hover:bg-green-600', hoverBorder: 'hover:border-indigo-500/40' },
]

/** Get a color set by index (cycles through the palette) */
export function getCategoryColor(index: number) {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length]
}
