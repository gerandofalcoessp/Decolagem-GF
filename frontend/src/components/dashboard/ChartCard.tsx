import { useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  BarElement,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { MoreVertical } from 'lucide-react';
import LoadingSpinner from '../ui/LoadingSpinner';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  BarElement
);

interface ChartCardProps {
  title: string;
  subtitle?: string;
  type: 'line' | 'doughnut' | 'bar' | 'pie';
  data: any;
  isLoading?: boolean;
  // Personalização para gráfico de linha
  lineColor?: string;
  lineBgOpacity?: number; // 0..1
}

export default function ChartCard({
  title,
  subtitle,
  type,
  data,
  isLoading = false,
  lineColor,
  lineBgOpacity = 0.12,
}: ChartCardProps) {
  const chartRef = useRef<any>(null);

  const hexToRgba = (hex: string, alpha: number) => {
    const sanitized = hex.replace('#', '');
    const bigint = parseInt(sanitized, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: lineColor || '#EC4899',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
      },
    },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { color: '#6B7280', font: { size: 12 } } },
      y: { grid: { color: '#F3F4F6' }, border: { display: false }, ticks: { color: '#6B7280', font: { size: 12 } } },
    },
    elements: { line: { tension: 0.4 }, point: { radius: 4, hoverRadius: 6 } },
  };

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: '#EC4899',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed;
            const dataArr = context.chart?.data?.datasets?.[0]?.data || [];
            const total = dataArr.reduce((sum: number, v: number) => sum + v, 0);
            const pct = total ? ((value / total) * 100).toFixed(1) : '0.0';
            return `${label}: ${value} (${pct}%)`;
          },
        },
      },
    },
    cutout: '60%',
  };

  const getChartData = () => {
    if (!data || !Array.isArray(data)) {
      return {
        labels: [],
        datasets: []
      };
    }

    if (type === 'line') {
      const lc = lineColor || '#EC4899';
      return {
        labels: data.map((item: any) => item.name),
        datasets: [
          {
            label: 'Dados',
            data: data.map((item: any) => item.value),
            borderColor: lc,
            backgroundColor: hexToRgba(lc, lineBgOpacity),
            fill: true,
            borderWidth: 2,
          },
        ],
      };
    }

    if (type === 'doughnut') {
      return {
        labels: data.map((item: any) => item.name),
        datasets: [
          {
            data: data.map((item: any) => item.value),
            backgroundColor: data.map((item: any) => item.color),
            borderWidth: 0,
            hoverBorderWidth: 2,
            hoverBorderColor: '#ffffff',
            hoverOffset: 8,
          },
        ],
      };
    }

    // Dados para gráfico de barras
    if (type === 'bar') {
      return {
        labels: data.map((item: any) => item.name),
        datasets: [
          {
            label: 'Programas',
            data: data.map((item: any) => item.value),
            backgroundColor: data.map((item: any) => item.color),
            hoverBorderWidth: 2,
            hoverBorderColor: '#ffffff',
            borderWidth: 0,
            maxBarThickness: 48,
          },
        ],
      };
    }
    
    return {
      labels: [],
      datasets: []
    };
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <div className="h-5 bg-gray-200 rounded animate-pulse w-32"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
          </div>
          <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="h-64 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        <button className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Chart */}
      <div className="h-64">
        {type === 'line' && (
          <Line
            ref={chartRef}
            data={getChartData()}
            options={lineChartOptions}
          />
        )}
        {type === 'doughnut' && (
          <Doughnut
            ref={chartRef}
            data={getChartData()}
            options={doughnutChartOptions}
          />
        )}
        {type === 'bar' && (
          <Bar
            ref={chartRef}
            data={getChartData()}
            options={barChartOptions}
          />
        )}
        {type === 'pie' && (
          <Doughnut
            ref={chartRef}
            data={getChartData()}
            options={doughnutChartOptions}
          />
        )}
      </div>
    </div>
  );
}

// Configuração do gráfico de barras verticais
const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        padding: 20,
        usePointStyle: true,
        font: { size: 12 },
        // Gera legenda por item (label + cor) igual ao doughnut
        generateLabels: (chart: any) => {
          const dataset = chart.data.datasets[0];
          return chart.data.labels.map((label: string, i: number) => ({
            text: label,
            fillStyle: Array.isArray(dataset.backgroundColor)
              ? dataset.backgroundColor[i]
              : dataset.backgroundColor,
            hidden: false,
            index: i,
          }));
        },
      },
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: 'white',
      bodyColor: 'white',
      borderColor: '#EC4899',
      borderWidth: 1,
      cornerRadius: 8,
      callbacks: {
        label: function(context: any) {
          const label = context.label || '';
          const value = context.parsed.y;
          const dataArr = context.chart?.data?.datasets?.[0]?.data || [];
          const total = dataArr.reduce((sum: number, v: number) => sum + v, 0);
          const pct = total ? ((value / total) * 100).toFixed(1) : '0.0';
          return `${label}: ${value} (${pct}%)`;
        },
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: { color: '#6B7280', font: { size: 12 } },
    },
    y: {
      grid: { color: '#F3F4F6' },
      border: { display: false },
      ticks: { color: '#6B7280', font: { size: 12 } },
    },
  },
  datasets: {
    bar: {
      borderRadius: 6,
      borderSkipped: false,
    },
  },
  animation: {
    duration: 800,
  },
};