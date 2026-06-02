interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export default function ChartCard({ title, children, className = "" }: ChartCardProps) {
  return (
    <div className={`bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow ${className}`}>
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
        <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-2 rounded-lg mr-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </span>
        {title}
      </h3>
      {children}
    </div>
  );
}

interface SimpleBarChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
}

export function SimpleBarChart({ data }: SimpleBarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <div key={index} className="group">
          <div className="flex items-center mb-1">
            <div className="w-24 text-sm font-semibold text-gray-700 text-right mr-3">
              {item.label}
            </div>
            <div className="flex-1 flex items-center">
              <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                <div 
                  className={`h-full rounded-full ${item.color || 'bg-gradient-to-r from-blue-500 to-blue-600'} flex items-center justify-end pr-3 transition-all duration-500 ease-out group-hover:opacity-90`}
                  style={{ 
                    width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
                    minWidth: item.value > 0 ? '32px' : '0'
                  }}
                >
                  <span className="text-white text-sm font-bold">
                    {item.value}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface DonutChartProps {
  data: Array<{ label: string; value: number; color: string }>;
  centerText?: string;
}

export function DonutChart({ data, centerText }: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="flex items-center justify-center">
      <div className="relative w-40 h-40">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="10"
          />
          {data.map((item, index) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0;
            const strokeDasharray = `${percentage * 2.51} 251.2`;
            
            // Calculate cumulative percentage from previous items
            const cumulativePercentage = data
              .slice(0, index)
              .reduce((sum, prevItem) => {
                return sum + (total > 0 ? (prevItem.value / total) * 100 : 0);
              }, 0);
            
            const strokeDashoffset = -cumulativePercentage * 2.51;

            return (
              <circle
                key={index}
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={item.color}
                strokeWidth="10"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500 hover:stroke-[12]"
              />
            );
          })}
        </svg>
        {centerText && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-extrabold text-gray-800">{centerText}</span>
            <span className="text-xs text-gray-500 font-semibold">Total</span>
          </div>
        )}
      </div>
      <div className="ml-8 space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center group cursor-pointer">
            <div 
              className="w-4 h-4 rounded-full mr-3 transition-transform group-hover:scale-110"
              style={{ backgroundColor: item.color }}
            />
            <div>
              <div className="text-sm font-semibold text-gray-800">
                {item.label}
              </div>
              <div className="text-xs text-gray-500">
                {item.value} ({total > 0 ? Math.round((item.value / total) * 100) : 0}%)
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}