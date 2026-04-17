import { ShieldAlert, Activity, Clock, Fingerprint, CheckCircle2 } from 'lucide-react'
import { prisma } from '@/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { RequestLogsTable } from '@/components/analytics/RequestLogsTable'
import MetricCard from '@/components/analytics/MatrixCard'


export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  // Fetch the latest 1000 logs for the dashboard
  const logs = await prisma.requestLog.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50 
  })

  const totalRequests = logs.length
  const unprocessedCount = logs.filter(l => !l.isProcessed).length
  const blockedCount = logs.filter(l => l.decision === 'BLOCK').length
  
  const totalLatency = logs.reduce((sum, log) => sum + log.latency, 0)
  const avgLatency = totalRequests > 0 ? Math.round((totalLatency / totalRequests)) : '0.0'
  const blockRate = totalRequests > 0 ? ((blockedCount / totalRequests) * 100).toFixed(1) : '0.0'

  return (
    <div className="max-w-[1200px] mx-auto p-6 md:p-10 font-sans animate-in fade-in duration-500">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Audit & Analytics</h1>
          </div>
          <p className="text-[14px] text-muted-foreground max-w-xl">
            Review real-time evaluations, background AI audits, and self-heal policy gaps.
          </p>
        </div>
      </header>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <MetricCard title="Total Traffic" value={totalRequests.toLocaleString()} icon={Activity} />
        <MetricCard title="Block Rate" value={`${blockRate}%`} icon={ShieldAlert} trend={blockedCount > 0 ? 'critical' : 'neutral'} />
        <MetricCard title="Avg Latency" value={`${avgLatency}ms`} icon={Clock} trend={Number(avgLatency) > 100 ? 'warning' : 'good'} />
        <MetricCard 
          title="Pending Audits" 
          value={unprocessedCount.toString()} 
          icon={Fingerprint} 
          trend={unprocessedCount > 0 ? 'warning' : 'good'} 
        />
      </div>

      {/* THE INTERACTIVE REVIEW QUEUE */}
      <div className="mt-8">
        <RequestLogsTable initialLogs={logs} />
      </div>

    </div>
  )
}

