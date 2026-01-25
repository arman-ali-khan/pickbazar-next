'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useMemo, useState } from "react";
import { format, subDays, startOfDay } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


type RevenueData = {
    created_at: string;
    total_amount: number;
};

interface RevenueChartProps {
    data: RevenueData[];
}

const ChartTooltipContent = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-1 gap-2">
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              Revenue
            </span>
            <span className="font-bold text-muted-foreground">
              ${payload[0].value.toFixed(2)}
            </span>
            <span className="text-xs text-muted-foreground">
              {label}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};


export default function RevenueChart({ data: rawData }: RevenueChartProps) {
    const [timeRange, setTimeRange] = useState('30'); // '7', '30', '90'

    const chartData = useMemo(() => {
        const days = parseInt(timeRange);
        const endDate = startOfDay(new Date());
        const startDate = subDays(endDate, days - 1);
        
        const filteredData = rawData.filter(d => new Date(d.created_at) >= startDate);

        const dailyRevenue = new Map<string, number>();

        // Initialize all days in the range with 0 revenue
        for (let i = 0; i < days; i++) {
            const date = format(subDays(endDate, i), 'MMM d');
            dailyRevenue.set(date, 0);
        }

        // Sum up revenue for each day
        for (const order of filteredData) {
            const date = format(new Date(order.created_at), 'MMM d');
            if (dailyRevenue.has(date)) {
                dailyRevenue.set(date, dailyRevenue.get(date)! + order.total_amount);
            }
        }
        
        // Convert map to array and sort by date
        return Array.from(dailyRevenue.entries())
            .map(([date, revenue]) => ({ date, revenue }))
            .reverse();
    }, [rawData, timeRange]);
    
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Revenue Overview</CardTitle>
                    <CardDescription>Total revenue from delivered orders.</CardDescription>
                </div>
                 <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7">Last 7 Days</SelectItem>
                        <SelectItem value="30">Last 30 Days</SelectItem>
                        <SelectItem value="90">Last 90 Days</SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                             <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="date" tickLine={false} axisLine={false} stroke="#888888" fontSize={12} />
                            <YAxis tickLine={false} axisLine={false} stroke="#888888" fontSize={12} tickFormatter={(value) => `$${value}`} />
                            <Tooltip content={<ChartTooltipContent />} />
                            <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}