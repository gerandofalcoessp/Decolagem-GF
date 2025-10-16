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
  goalValue?: number;
  iconColor?: 'decolagem' | 'maras' | 'light-red' | 'green' | 'default';
  customMetaText?: string; // Nova prop para texto customizado no lugar de "Meta"
  hideMetaPercentage?: boolean; // Nova prop para esconder a porcentagem da meta
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
  goalValue,
  iconColor = 'default',
  customMetaText,
  hideMetaPercentage = false,
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
      'group relative overflow-hidden rounded-2xl border-0 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-gradient-to-br',
      color === 'primary' && 'from-blue-50 via-white to-blue-50/50 border border-blue-100/50',
      color === 'secondary' && 'from-purple-50 via-white to-purple-50/50 border border-purple-100/50',
      color === 'success' && 'from-green-50 via-white to-green-50/50 border border-green-100/50',
      color === 'warning' && 'from-yellow-50 via-white to-yellow-50/50 border border-yellow-100/50',
      color === 'error' && 'from-red-50 via-white to-red-50/50 border border-red-100/50'
    )}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-24 h-24 opacity-5">
        <div className={cn(
          'w-full h-full rounded-full',
          color === 'primary' && 'bg-blue-500',
          color === 'secondary' && 'bg-purple-500',
          color === 'success' && 'bg-green-500',
          color === 'warning' && 'bg-yellow-500',
          color === 'error' && 'bg-red-500'
        )}></div>
      </div>
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-sm font-semibold text-gray-700 truncate">
              {title}
            </p>
          </div>
          
          <div className="mb-3">
            <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Realizado</span>
            <p className="text-3xl font-bold text-blue-600 leading-none">
              {value}
            </p>
          </div>
          
          {percentage !== undefined && (
            <div className="flex items-center justify-end gap-2 mb-3">
              <div className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-full text-sm font-semibold',
                percentage >= 80 ? 'bg-green-100 text-green-700' : 
                percentage >= 60 ? 'bg-yellow-100 text-yellow-700' : 
                'bg-red-100 text-red-700'
              )}>
                {Math.round(percentage)}%
              </div>
            </div>
          )}
          
          {goalValue && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    {customMetaText || "Meta"}
                  </span>
                  {!hideMetaPercentage && (
                    <span className="text-lg font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                      {goalValue.toLocaleString('pt-BR')}
                    </span>
                  )}
                </div>
                {!hideMetaPercentage && (() => {
                  const currentValue = parseInt(value.replace(/\D/g, '')) || 0;
                  const remaining = Math.max(0, goalValue - currentValue);
                  const percentageToGo = goalValue > 0 ? Math.round((remaining / goalValue) * 100) : 0;
                  
                  return remaining > 0 ? (
                    <div className="flex items-center gap-1 mr-4">
                      <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-full border border-orange-200">
                        Faltam {percentageToGo}%
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 mr-4">
                      <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200">
                        ✓ Meta atingida
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
        
        <div className={cn(
          'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-all duration-300 group-hover:scale-110',
          iconColor === 'decolagem' && 'bg-blue-500 text-white',
          iconColor === 'maras' && 'bg-pink-500 text-white',
          iconColor === 'light-red' && 'bg-red-400 text-white',
          iconColor === 'green' && 'bg-green-500 text-white',
          iconColor === 'default' && color === 'primary' && 'bg-blue-500 text-white',
          iconColor === 'default' && color === 'secondary' && 'bg-purple-500 text-white',
          iconColor === 'default' && color === 'success' && 'bg-green-500 text-white',
          iconColor === 'default' && color === 'warning' && 'bg-yellow-500 text-white',
          iconColor === 'default' && color === 'error' && 'bg-red-500 text-white'
        )}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}