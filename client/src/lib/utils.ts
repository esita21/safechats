import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  });
}

// Generate a random color from a predefined kid-friendly palette
export function getRandomColor(): string {
  const colors = [
    '#FF6B6B', // Red
    '#48DBFB', // Blue
    '#1DD1A1', // Green
    '#FFC312', // Yellow
    '#9C88FF', // Purple
    '#FF9FF3', // Pink
    '#54A0FF', // Sky Blue
    '#FF9F43', // Orange
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
}

// Generate initials from a name
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

// Check if array/object is empty
export function isEmpty(obj: any): boolean {
  if (Array.isArray(obj)) return obj.length === 0;
  if (obj instanceof Map || obj instanceof Set) return obj.size === 0;
  if (obj && typeof obj === 'object') return Object.keys(obj).length === 0;
  return !obj;
}
