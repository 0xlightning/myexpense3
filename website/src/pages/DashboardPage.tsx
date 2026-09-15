import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts'
import { CalendarDays, Filter } from 'lucide-react'
import { ErrorState, LoadingLabel } from '@/components/States'
import { SplitDonut } from '@/components/SplitDonut'
import { Card, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  buildNetWorthHistory,
  currentMonthRange,
  type NetWorthPoint,
  netWorth,
  sumAmounts,
} from '@/lib/derive'
import { formatCurrency, formatSignedCurrency, plural } from '@/lib/format'
import { KINDS, type Kind, type KindMeta } from '@/lib/kinds'
import { cn } from '@/lib/utils'
import { useAllRecords, useCategories, useRecords } from '@/store'

// ─── Filter types ──────────────────────────────────────────────────────────────

type PeriodFilter = 'this_month' | 'last_month' | 'last_3m' | 'last_6m' | 'this_year' | 'all'
type KindFilter = 'all' | Kind

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_3m', label: 'Last 3 Months' },
  { value: 'last_6m', label: 'Last 6 Months' },
  { value: 'this_year', label: 'This Year' },
  { value: 'all', label: 'All Time' },
]

function getPeriodRange(period: PeriodFilter): { startYMD: string; endYMD: string } | null {
  const now = new Date()
  const ymd = (d: Date) =>
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`

  if (period === 'all') return null

  if (period === 'this_month') {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0))
    return { startYMD: ymd(start), endYMD: ymd(end) }
  }
  if (period === 'last_month') {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0))
    return { startYMD: ymd(start), endYMD: ymd(end) }
  }
  if (period === 'last_3m') {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 2, 1))
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0))
    return { startYMD: ymd(start), endYMD: ymd(end) }
  }
  if (period === 'last_6m') {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1))
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0))
    return { startYMD: ymd(start), endYMD: ymd(end) }
  }
  if (period === 'this_year') {
    const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1))
    const end = new Date(Date.UTC(now.getUTCFullYear(), 11, 31))
    return { startYMD: ymd(start), endYMD: ymd(end) }
  }
  return null
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function CardSkeleton({ what, hero = false }: { what: string; hero?: boolean }) {
  return (
    <div className="grid gap-3 p-5">
      <LoadingLabel what={what} />
      <Skeleton className={hero ? 'h-10 w-48 rounded-xl' : 'h-8 w-32 rounded-xl'} />
      <Skeleton className="h-4 w-3/4 rounded-lg" />
    </div>
  )
}

function padMonthHistory(
  points: NetWorthPoint[],
  range: { startYMD: string; endYMD: string },
): NetWorthPoint[] {
  if (points.length >= 2) return points
  const first = points[0]
  const seedStart: NetWorthPoint = { date: range.startYMD, value: first?.value ?? 0 }
  if (points.length === 0) {
    const today = new Date()
    const todayYMD = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}-${String(today.getUTCDate()).padStart(2, '0')}`
    return [seedStart, { date: todayYMD, value: 0 }]
  }
  if (points.length === 1) {
    if (first.date === range.startYMD) {
      return [seedStart, { date: range.endYMD, value: first.value }]
    }
    return [seedStart, first]
  }
  return points
}

function useChartSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const rect = el.getBoundingClientRect()
      setSize({ width: Math.max(0, Math.floor(rect.width)), height: Math.max(0, Math.floor(rect.height)) })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, size] as const
}

// ─── Filter Bar ────────────────────────────────────────────────────────────────

interface DashboardFilters {
  period: PeriodFilter
  kindFilter: KindFilter
}

function FilterBar({
  filters,
  onChange,
}: {
  filters: DashboardFilters
  onChange: (f: DashboardFilters) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 p-3 sm:p-4 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm shadow-xs">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground shrink-0">
        <Filter className="size-3.5" />
        Filters
      </div>
      <div className="h-4 w-px bg-border/60 hidden sm:block" />

      {/* Period Filter */}
      <div className="relative flex items-center">
        <CalendarDays className="absolute left-2.5 size-3.5 text-muted-foreground pointer-events-none" />
        <select
          value={filters.period}
          onChange={(e) => onChange({ ...filters, period: e.target.value as PeriodFilter })}
          className="h-8 pl-8 pr-7 text-xs rounded-xl border border-input bg-background text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring transition-colors hover:border-border font-medium"
          aria-label="Filter by period"
        >
          {PERIOD_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-2 text-muted-foreground text-[10px]">▼</span>
      </div>

      {/* Kind Filter */}
      <div className="relative flex items-center">
        <select
          value={filters.kindFilter}
          onChange={(e) => onChange({ ...filters, kindFilter: e.target.value as KindFilter })}
          className="h-8 pl-3 pr-7 text-xs rounded-xl border border-input bg-background text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring transition-colors hover:border-border font-medium"
          aria-label="Filter by type"
        >
          <option value="all">All Types</option>
          {KINDS.map((k) => (
            <option key={k.kind} value={k.kind}>{k.label}</option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-2 text-muted-foreground text-[10px]">▼</span>
      </div>

      {/* Active filter chips */}
      {(filters.period !== 'this_month' || filters.kindFilter !== 'all') && (
        <button
          type="button"
          onClick={() => onChange({ period: 'this_month', kindFilter: 'all' })}
          className="ml-auto h-8 px-3 text-xs rounded-xl border border-border/60 text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/50 transition-colors font-medium"
        >
          Reset
        </button>
      )}
    </div>
  )
}

// ─── Net Worth Card ────────────────────────────────────────────────────────────

function NetWorthCard({ period }: { period: PeriodFilter }) {
  const all = useAllRecords()
  const failed = all.find((s) => s.status === 'error')
  const ready = all.every((s) => s.status === 'ready')

  const periodRange = useMemo(() => getPeriodRange(period), [period])

  const filteredItems = useMemo(() => {
    if (!ready) return all.map((s) => s.items)
    return all.map((s) => {
      if (!periodRange) return s.items
      return s.items.filter(
        (r) => r.date >= periodRange.startYMD && r.date <= periodRange.endYMD
      )
    })
  }, [ready, all, periodRange])

  const totals = filteredItems.map((items) => sumAmounts(items))
  const value = netWorth(Object.fromEntries(KINDS.map((k, i) => [k.kind, totals[i]])) as Record<Kind, number>)
  const formula = KINDS.map((k, i) => {
    const op = k.sign < 0 ? '− ' : i === 0 ? '' : '+ '
    return `${op}${formatCurrency(totals[i])} ${k.label.toLowerCase()}`
  }).join(' ')

  const monthRange = currentMonthRange()
  const history = useMemo(() => {
    if (!ready) return []
    const raw = buildNetWorthHistory(
      all.map((s) => s.items),
      { startMs: monthRange.startMs, endMs: monthRange.endMs },
    )
    return padMonthHistory(raw, monthRange)
  }, [ready, all, monthRange])

  const [chartWrap, chartSize] = useChartSize<HTMLDivElement>()

  const lineColor = useMemo(() => {
    if (value === 0) return '#898781'
    if (history.length < 2) return '#3b82f6'
    const startVal = history[0].value
    const endVal = history[history.length - 1].value
    if (endVal > startVal) return '#10b981'
    if (endVal < startVal) return '#ef4444'
    return '#3b82f6'
  }, [history, value])

  return (
    <Card className="h-full min-h-0 flex flex-col justify-between gap-4 p-5 sm:p-6 rounded-2xl border-border/70 shadow-xs md:col-span-3">
      {failed ? (
        <ErrorState what="net worth" error={failed.error} />
      ) : !ready ? (
        <CardSkeleton what="net worth" hero />
      ) : (
        <>
          <div className="flex flex-col md:flex-row gap-5 min-h-0 flex-1 items-stretch justify-between">
            <div className="flex flex-col gap-1.5 shrink-0 justify-center">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Net worth</span>
              <p
                className={cn(
                  'text-4xl sm:text-5xl font-extrabold tracking-tight',
                  value > 0 && 'text-success',
                  value < 0 && 'text-critical',
                )}
              >
                {formatSignedCurrency(value)}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
                    value > 0
                      ? 'bg-success/10 text-success'
                      : value < 0
                        ? 'bg-critical/10 text-critical'
                        : 'bg-muted text-muted-foreground',
                  )}
                >
                  {value > 0 ? 'Surplus' : value < 0 ? 'Deficit' : 'Balanced'}
                </span>
              </div>
            </div>
            <div ref={chartWrap} className="min-h-[140px] md:min-h-0 w-full flex-1">
              {chartSize.width > 0 && chartSize.height > 0 ? (
                <LineChart
                  width={chartSize.width}
                  height={chartSize.height}
                  data={history}
                  margin={{ top: 12, right: 12, left: 4, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    tickFormatter={(d) => {
                      const parts = String(d).split('-')
                      return parts.length === 3 ? `${parts[1]}/${parts[2]}` : String(d)
                    }}
                  />
                  <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} width={0} />
                  <Tooltip
                    wrapperStyle={{ outline: 'none' }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.[0]) return null
                      const v = payload[0].value as number
                      return (
                        <div className="rounded-xl border border-border/80 bg-card p-3 text-xs shadow-xl">
                          <p className="text-muted-foreground font-medium mb-0.5">{String(label)}</p>
                          <p
                            className={cn(
                              'font-bold text-sm',
                              v > 0 && 'text-success',
                              v < 0 && 'text-critical',
                            )}
                          >
                            {formatSignedCurrency(v)}
                          </p>
                        </div>
                      )
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={lineColor}
                    strokeWidth={3}
                    dot={{ r: 4, fill: lineColor }}
                    activeDot={{ r: 6 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              ) : null}
            </div>
          </div>
          <div className="pt-3 border-t border-border/60 text-xs font-medium text-muted-foreground leading-relaxed">
            {formula}
          </div>
        </>
      )}
    </Card>
  )
}

// ─── Kind Total Card ───────────────────────────────────────────────────────────

function KindTotalCard({ kind, period }: { kind: KindMeta; period: PeriodFilter }) {
  const records = useRecords(kind)
  const categories = useCategories(kind)
  const failed = [records, categories].find((s) => s.status === 'error')
  const ready = records.status === 'ready' && categories.status === 'ready'
  const what = `total ${kind.label.toLowerCase()}`

  const periodRange = useMemo(() => getPeriodRange(period), [period])

  const filteredItems = useMemo(() => {
    if (!ready || !periodRange) return records.items
    return records.items.filter(
      (r) => r.date >= periodRange.startYMD && r.date <= periodRange.endYMD
    )
  }, [ready, records.items, periodRange])

  return (
    <Card className="h-full min-h-0 flex flex-col justify-between p-4 rounded-2xl border-border/70 shadow-xs">
      <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Total {kind.label.toLowerCase()}
      </CardTitle>
      {failed ? (
        <ErrorState what={what} error={failed.error} />
      ) : !ready ? (
        <CardSkeleton what={what} />
      ) : (
        <div className="pt-2">
          <p className="text-2xl font-bold tracking-tight text-foreground">{formatCurrency(sumAmounts(filteredItems))}</p>
          <p className="text-xs text-muted-foreground font-medium pt-0.5">
            {plural(filteredItems.length, 'record', 'records')} ·{' '}
            {plural(categories.items.length, kind.noun.toLowerCase(), kind.nounPlural)}
          </p>
        </div>
      )}
    </Card>
  )
}

// ─── Dashboard Page ────────────────────────────────────────────────────────────

export function DashboardPage() {
  const [filters, setFilters] = useState<DashboardFilters>({
    period: 'this_month',
    kindFilter: 'all',
  })

  const visibleKinds = useMemo(
    () => (filters.kindFilter === 'all' ? KINDS : KINDS.filter((k) => k.kind === filters.kindFilter)),
    [filters.kindFilter],
  )

  return (
    <div className="grid gap-6">
      {/* Filter Bar */}
      <FilterBar filters={filters} onChange={setFilters} />

      {/* Net Worth + Totals Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch">
        <NetWorthCard period={filters.period} />
        <div className="grid grid-cols-1 md:grid-rows-3 md:col-span-1 gap-4 h-full">
          {KINDS.map((k) => (
            <KindTotalCard key={k.kind} kind={k} period={filters.period} />
          ))}
        </div>
      </div>

      {/* Donut Charts — filtered by kind */}
      {visibleKinds.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-3">
          {visibleKinds.map((k) => (
            <SplitDonut key={k.kind} kind={k} />
          ))}
        </div>
      )}
    </div>
  )
}
