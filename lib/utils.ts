import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPercentage(value: number): string {
  if (isNaN(value) || !isFinite(value)) return '0.00'
  return (Math.min(100, Math.max(0, value))).toFixed(2)
}
