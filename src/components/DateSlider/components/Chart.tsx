import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';

type ChartProps = {
  visibleData: {
    year: number;
    value: number;
  }[];
  viewMode: 'range' | 'point' | 'combined';
  currentPointYear: number;
};

export const Chart = ({ visibleData, viewMode, currentPointYear }: ChartProps) => {
  return (
    <div className="relative bg-gray-50 rounded-lg p-4 mb-6" style={{ height: '300px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={visibleData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <XAxis
            dataKey="year"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#666' }}
            interval="preserveStartEnd"
          />
          <YAxis hide />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#3b82f6' }}
          />
          {(viewMode === 'point' || viewMode === 'combined') && (
            <ReferenceLine
              x={currentPointYear}
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          )}
        </LineChart>
      </ResponsiveContainer>

      {/* Year indicators */}
      <div className="absolute top-4 left-6 text-sm text-gray-500 font-medium">1990</div>
      <div className="absolute top-4 left-1/4 text-sm text-gray-500 font-medium">2000</div>
      <div className="absolute top-4 left-2/4 text-sm text-gray-500 font-medium">2010</div>
      <div className="absolute top-4 right-1/4 text-sm text-gray-500 font-medium">2020</div>
      <div className="absolute top-4 right-6 text-sm text-gray-500 font-medium">2025</div>
    </div>
  );
};
