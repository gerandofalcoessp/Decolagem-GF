import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '../../utils/cn';

interface StatsCardProps {
  title: string;
  value: string;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  isLoading?: boolean;
  percentage?: number;
  showRealizadoMetaLabel?: boolean;
}

const colorClasses = {
  primary: {
    bg: 'bg-primary-50',
    icon: 'text-primary-600',
    border: 'border-primary-100',
  },
  secondary: {
    bg: 'bg-secondary-50',
    icon: 'text-secondary-600',
    border: 'border-secondary-100',
  },
  success: {
    bg: 'bg-green-50',
    icon: 'text-green-600',
    border: 'border-green-100',
  },
  warning: {
    bg: 'bg-yellow-50',
    icon: 'text-yellow-600',
    border: 'border-yellow-100',
  },
  error: {
    bg: 'bg-red-50',
    icon: 'text-red-600',
    border: 'border-red-100',
  },
};

const trendClasses = {
  up: {
    text: 'text-green-600',
    bg: 'bg-green-100',
    icon: ArrowUpRight,
  },
  down: {
    text: 'text-red-600',
    bg: 'bg-red-100',
    icon: ArrowDownRight,
  },
  neutral: {
    text: 'text-gray-600',
    bg: 'bg-gray-100',
    icon: Minus,
  },
};

export default function StatsCard({
  title,
  value,
  change,
  trend = 'neutral',
  icon: Icon,
  color = 'primary',
  isLoading = false,
  percentage,
  showRealizadoMetaLabel,
}: StatsCardProps) {
  const colorClass = colorClasses[color];
  const trendClass = trendClasses[trend];
  const TrendIcon = trendClass.icon;

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-3 flex-1">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded animate-pulse w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
          </div>
          <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'group rounded-xl border p-6 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5',
      colorClass.bg,
      colorClass.border
    )}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2 flex items-center">
            <span>{title}</span>
            {showRealizadoMetaLabel && (
              <span className="text-xs text-gray-500 ml-2">(Realizado/Meta)</span>
            )}
          </p>
          <p className="text-2xl font-bold text-gray-900 mb-2 whitespace-nowrap">
            {value}
          </p>
          {percentage !== undefined && (
            <p className={cn('text-sm font-semibold mb-2', colorClass.icon)}>{Math.round(percentage)}%</p>
          )}
          {change !== undefined && (
            <div className="flex items-center space-x-1">
              <div className={cn(
                'flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium',
                trendClass.bg,
                trendClass.text
              )}>
                <TrendIcon className="w-3 h-3" />
                <span>
                  {Math.abs(change)}%
                </span>
              </div>
              <span className="text-xs text-gray-500">
                vs. mês anterior
              </span>
            </div>
          )}
        </div>
        <div className={cn(
          'w-12 h-12 rounded-lg flex items-center justify-center bg-white/70 backdrop-blur-sm border border-white/60 shadow-sm group-hover:shadow-md'
        )}>
          <Icon className={cn('w-6 h-6', colorClass.icon)} />
        </div>
      </div>
    </div>
  );
}