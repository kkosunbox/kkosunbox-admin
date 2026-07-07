import { cn } from '@/lib/utils';

interface BadgeProps {
  label: string;
  color: string;
  className?: string;
}

export function Badge({ label, color, className }: BadgeProps) {
  return <span className={cn('badge', color, className)}>{label}</span>;
}
