import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: {
    value: string;
    positive: boolean;
  };
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-brand-500',
  iconBg = 'bg-brand-50',
  trend,
}: StatsCardProps) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium leading-relaxed text-text-muted">{title}</p>
        <div
          className={cn(
            'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl',
            iconBg,
          )}
        >
          <Icon size={15} className={iconColor} />
        </div>
      </div>
      <p className="mt-3 text-[26px] font-bold leading-none tracking-tight text-text-primary">
        {value}
      </p>
      {subtitle && (
        <p className="mt-1.5 text-xs text-text-muted">{subtitle}</p>
      )}
      {trend && (
        <span
          className={cn(
            'mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
            trend.positive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500',
          )}
        >
          {trend.positive ? '↑' : '↓'} {trend.value}
        </span>
      )}
    </div>
  );
}
