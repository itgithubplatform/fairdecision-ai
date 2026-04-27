import { Activity, Fingerprint, ActivitySquare, Zap, ArrowRight } from 'lucide-react'
import { prisma } from '@/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { RequestLogsTable } from '@/components/analytics/RequestLogsTable'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import VolumeChart  from '@/components/analytics/VolumeChart'
import AuditorLineChart  from '@/components/analytics/AuditorLineChart'
import LatencyChart from '@/components/analytics/LatencyChart'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/auth/signin')

  const logs = await prisma.requestLog.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 200 
  })

  // --- KPI CALCULATIONS FOR THE BIG NUMBERS ---
  const totalVolume = logs.length
  
  const totalLatency = logs.reduce((sum, log) => sum + log.latency, 0)
  const avgLatency = totalVolume > 0 ? Math.round((totalLatency / totalVolume)) : 0
  
  const processedLogs = logs.filter(l => l.isProcessed)
  const agreedLogs = processedLogs.filter(l => l.auditorStatus === 'AGREE')
  const auditorAccuracy = processedLogs.length > 0 
    ? ((agreedLogs.length / processedLogs.length) * 100).toFixed(1) 
    : '0.0'

  // --- UNIFIED DATA TRANSFORMATION FOR CHARTS ---
  const chartDataMap = new Map()
  
  logs.reverse().forEach(log => {
    const timeKey = new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    
    if (!chartDataMap.has(timeKey)) {
      chartDataMap.set(timeKey, { 
        time: timeKey, 
        passed: 0,
        blocked: 0,
        agreed: 0, 
        flagged: 0, 
        latency: 0, 
        count: 0 
      })
    } 

    const entry = chartDataMap.get(timeKey)
    entry.count += 1
    
    // Rolling average for latency
    entry.latency = Math.round(((entry.latency * (entry.count - 1)) + log.latency) / entry.count)

    // Proxy Traffic Data
    if (log.decision === 'BLOCK' || log.decision === 'FLAG') entry.blocked += 1
    else entry.passed += 1

    // Auditor Health Data
    if (log.isProcessed) {
      if (log.auditorStatus === 'AGREE') entry.agreed += 1
      else entry.flagged += 1 
    }
  })
  
  const timeSeriesData = Array.from(chartDataMap.values())

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
      Real-time visual telemetry of your fast engine proxy and background compliance auditor.
    </p>
  </div>
  
  {/* THE UPDATED LINK */}
  <Button asChild variant="default" className="group px-4! font-semibold">
    <Link href="/dashboard/csv-upload">
      Bulk Dataset Audit
      <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1 font-bold" />
    </Link>
  </Button>
</header>

      {/* VISUAL DASHBOARD GRID (3 Distinct Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* CHART 1: Raw Traffic Volume */}
        <Card className="shadow-sm border-border bg-card">
          <CardHeader className="pb-2 relative">
            <div>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <ActivitySquare className="w-4 h-4 text-muted-foreground"/> Fast Engine Volume
              </CardTitle>
              <CardDescription>Total prompts passed vs blocked.</CardDescription>
            </div>
            <div className="absolute top-6 right-6 text-2xl font-bold tracking-tight text-foreground">
              {totalVolume.toLocaleString()}
            </div>
          </CardHeader>
          <CardContent className="h-[250px] pt-4">
             <VolumeChart data={timeSeriesData} />
          </CardContent>
        </Card>

        {/* CHART 2: Auditor Alignment */}
        <Card className="shadow-sm border-border bg-card">
          <CardHeader className="pb-2 relative">
            <div>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-muted-foreground"/> AI Auditor Trend
              </CardTitle>
              <CardDescription>Accuracy checks and flagged overrides.</CardDescription>
            </div>
            <div className="absolute top-6 right-6 text-2xl font-bold tracking-tight text-foreground">
              {auditorAccuracy}%
            </div>
          </CardHeader>
          <CardContent className="h-[250px] pt-4">
             <AuditorLineChart data={timeSeriesData} />
          </CardContent>
        </Card>

        {/* CHART 3: System Latency */}
        <Card className="shadow-sm border-border bg-card">
          <CardHeader className="pb-2 relative">
            <div>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Zap className="w-4 h-4 text-muted-foreground"/> Proxy Latency
              </CardTitle>
              <CardDescription>Average inline execution time.</CardDescription>
            </div>
            <div className={`absolute top-6 right-6 text-2xl font-bold tracking-tight ${avgLatency > 500 ? 'text-amber-500' : 'text-foreground'}`}>
              {avgLatency}ms
            </div>
          </CardHeader>
          <CardContent className="h-[250px] pt-4">
             <LatencyChart data={timeSeriesData} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-medium tracking-tight mb-4 text-foreground">Actionable Audit Log</h3>
        <RequestLogsTable initialLogs={logs.slice(0, 50)} />
      </div>

    </div>
  )
}