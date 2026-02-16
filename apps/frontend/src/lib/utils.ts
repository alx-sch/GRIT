import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function trimText(text: string, maxLength: number = 24): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}
