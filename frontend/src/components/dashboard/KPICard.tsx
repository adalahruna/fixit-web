interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray';
}

export default function KPICard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  color = 'blue' 
}: KPICardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 border-blue-200',
    green: 'bg-green-100 text-green-600 border-green-200',
    purple: 'bg-purple-100 text-purple-600 border-purple-200',
    orange: 'bg-orange-100 text-orange-600 border-orange-200',
    red: 'bg-red-100 text-red-600 border-red-200',
    gray: 'bg-gray-100 text-gray-600 border-gray-200'
  };

  const gradientClasses = {
    blue: 'from-blue-50 to-blue-100',
    green: 'from-green-50 to-green-100',
    purple: 'from-purple-50 to-purple-100',
    orange: 'from-orange-50 to-orange-100',
    red: 'from-red-50 to-red-100',
    gray: 'from-gray-50 to-gray-100'
  };

  return (
    <div className={`bg-gradient-to-br ${gradientClasses[color]} p-6 rounded-xl shadow-lg hover:shadow-xl transition-all border-2 ${colorClasses[color].split(' ').pop()}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-700 mb-2">{title}</p>
          <p className="text-3xl font-extrabold text-gray-900 mb-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-600 mt-2 bg-white/60 rounded-lg px-3 py-1.5 inline-block">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="flex items-center mt-3 bg-white/60 rounded-lg px-3 py-1.5 inline-flex">
              <svg 
                className={`w-5 h-5 mr-1 ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d={trend.isPositive ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} 
                />
              </svg>
              <span className={`text-sm font-bold ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-gray-500 ml-1">vs last period</span>
            </div>
          )}
        </div>
        <div className={`p-4 rounded-xl ${colorClasses[color]} border-2`}>
          {icon}
        </div>
      </div>
    </div>
  );
}