import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const mockData = [
  { date: 'Jan 1', effort: 40, results: 65, ratio: 1.6 },
  { date: 'Jan 8', effort: 45, results: 80, ratio: 1.8 },
  { date: 'Jan 15', effort: 38, results: 95, ratio: 2.5 },
  { date: 'Jan 22', effort: 50, results: 110, ratio: 2.2 },
  { date: 'Jan 29', effort: 42, results: 125, ratio: 3.0 },
  { date: 'Feb 5', effort: 48, results: 140, ratio: 2.9 },
  { date: 'Feb 12', effort: 44, results: 160, ratio: 3.6 },
];

export default function EffortChart() {
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-foreground">Effort vs Results Trend</CardTitle>
        <p className="text-sm text-muted-foreground">
          Weekly comparison of team effort hours vs marketing results
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                className="text-muted-foreground"
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                className="text-muted-foreground"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-lg)',
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="effort" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                name="Effort Hours"
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="results" 
                stroke="hsl(var(--accent))" 
                strokeWidth={3}
                name="Results Score"
                dot={{ fill: 'hsl(var(--accent))', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Avg Effort</p>
            <p className="text-lg font-semibold text-primary">44h</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Avg Results</p>
            <p className="text-lg font-semibold text-accent">110</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Efficiency Ratio</p>
            <p className="text-lg font-semibold text-success">2.5x</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}