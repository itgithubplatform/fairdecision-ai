"use client"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function VolumeChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip 
          cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} 
          contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px', color: 'hsl(var(--foreground))' }} 
          itemStyle={{ color: 'hsl(var(--foreground))' }}
        />
        {/* ADDED maxBarSize=40 */}
        <Bar dataKey="passed" name="Passed" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} maxBarSize={40} />
        <Bar dataKey="blocked" name="Blocked" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  )
}