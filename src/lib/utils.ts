import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeDepartmentName(dept: string | null | undefined): string {
  if (!dept || !dept.trim()) return 'Unknown';
  const clean = dept.trim().toLowerCase();

  if (clean === 'cs' || clean === 'cse' || clean.includes('computer science')) return 'CS';
  if (clean === 'it' || clean.includes('information technology')) return 'IT';
  if (clean === 'aiml' || clean.includes('machine learning') || clean.includes('ai & ml') || clean.includes('ai/ml')) return 'AIML';
  if (clean === 'aids' || clean.includes('data science') || clean.includes('ai & ds') || clean.includes('ai/ds')) return 'AIDS';
  if (clean === 'entc' || clean === 'e&tc' || clean.includes('telecommunication') || clean === 'extc') return 'ENTC';
  if (clean === 'ece' || clean.includes('electronics')) return 'ECE';
  if (clean === 'mech' || clean.includes('mechanical')) return 'Mechanical';
  if (clean === 'civil') return 'Civil';
  if (clean === 'prod' || clean.includes('production')) return 'Production';
  if (clean === 'elec' || clean.includes('electrical')) return 'Electrical';

  const trimmed = dept.trim();
  if (trimmed.length <= 5) return trimmed.toUpperCase();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}
