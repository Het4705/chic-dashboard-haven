
import React from 'react';
import { Card } from '@/components/ui/card';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

type SalesChartProps = {
  data?: Array<{
    name: string;
    total: number;
  }>;
};

const defaultData = [
  { name: 'Jan', total: 2400 },
  { name: 'Feb', total: 1398 },
  { name: 'Mar', total: 9800 },
  { name: 'Apr', total: 3908 },
  { name: 'May', total: 4800 },
  { name: 'Jun', total: 3800 },
  { name: 'Jul', total: 4300 },
];

export function SalesChart({ data = defaultData }: SalesChartProps) {
  return (
    <Card className="p-4">
      <div className="font-semibold mb-4">Monthly Sales</div>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data}>
          <XAxis 
            dataKey="name" 
            stroke="#888888" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
          />
          <YAxis 
            stroke="#888888" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip 
            formatter={(value: number) => [`$${value}`, 'Total']}
            labelStyle={{ overflow: 'hidden', textOverflow: 'ellipsis' as const }}
          />
          <CartesianGrid vertical={false} stroke="#f5f5f5" />
          <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
