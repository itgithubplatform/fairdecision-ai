function MetricCard({ title, value, icon: Icon, trend }: { title: string, value: string, icon: any, trend?: 'good' | 'warning' | 'critical' | 'neutral' }) {
  let valueColor = "text-foreground"
  if (trend === 'good') valueColor = "text-emerald-500"
  if (trend === 'warning') valueColor = "text-amber-500"
  if (trend === 'critical') valueColor = "text-destructive"

  return (
    <div className="border border-border rounded-xl bg-card p-5 shadow-sm flex flex-col justify-between h-[110px]">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-muted-foreground">{title}</span>
        <Icon className="w-4 h-4 text-muted-foreground/50" />
      </div>
      <span className={`text-2xl font-bold tracking-tight ${valueColor}`}>{value}</span>
    </div>
  )
}
export default MetricCard