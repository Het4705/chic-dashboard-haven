
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Example data, would be replaced with real data in a production app
const data = [
  { name: 'Jan', activeUsers: 400 },
  { name: 'Feb', activeUsers: 580 },
  { name: 'Mar', activeUsers: 800 },
  { name: 'Apr', activeUsers: 908 },
  { name: 'May', activeUsers: 1200 },
  { name: 'Jun', activeUsers: 1450 },
  { name: 'Jul', activeUsers: 1800 },
];

export const UserChart = () => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Active Users</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                className="text-xs font-medium"
              />
              <YAxis 
                className="text-xs font-medium"
              />
              <Tooltip 
                formatter={(value: number) => [`${value.toLocaleString()} users`, 'Active Users']}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                }}
              />
              <Line 
                type="monotone" 
                dataKey="activeUsers" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
