import { ErrorState, LoadingLabel } from '@/components/States'
import { SplitDonut } from '@/components/SplitDonut'
import { Card, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { netWorth, sumAmounts } from '@/lib/derive'
import { formatCurrency, formatSignedCurrency, plural } from '@/lib/format'
import { KINDS, type Kind, type KindMeta } from '@/lib/kinds'
import { cn } from '@/lib/utils'
import { useAllRecords, useCategories, useRecords } from '@/store'

function CardSkeleton({ what, hero = false }: { what: string; hero?: boolean }) {
  return (
    <>
      <LoadingLabel what={what} />
      <Skeleton className={hero ? 'h-9 w-44' : 'h-8 w-32'} />
      <Skeleton className="h-4 w-3/4" />
    </>
  )
}

function NetWorthCard() {
  const all = useAllRecords()
  const failed = all.find((s) => s.status === 'error')
  const ready = all.every((s) => s.status === 'ready')
  const totals = KINDS.map((_, i) => sumAmounts(all[i].items))
  const value = netWorth(Object.fromEntries(KINDS.map((k, i) => [k.kind, totals[i]])) as Record<Kind, number>)
  const formula = KINDS.map((k, i) => {
    const op = k.sign < 0 ? '− ' : i === 0 ? '' : '+ '
    return `${op}${formatCurrency(totals[i])} ${k.label.toLowerCase()}`
  }).join(' ')

  return (
    <Card className="gap-2 sm:col-span-2">
      <CardTitle>Net worth</CardTitle>
      {failed ? (
        <ErrorState what="net worth" error={failed.error} />
      ) : !ready ? (
        <CardSkeleton what="net worth" hero />
      ) : (
        <>
          <p
            className={cn(
              'text-3xl font-semibold tracking-tight',
              value > 0 && 'text-success',
              value < 0 && 'text-critical',
            )}
          >
            {formatSignedCurrency(value)}
          </p>
          <p className="text-sm text-muted-foreground">{formula}</p>
        </>
      )}
    </Card>
  )
}

function KindTotalCard({ kind }: { kind: KindMeta }) {
  const records = useRecords(kind)
  const categories = useCategories(kind)
  const failed = [records, categories].find((s) => s.status === 'error')
  const ready = records.status === 'ready' && categories.status === 'ready'
  const what = `total ${kind.label.toLowerCase()}`

  return (
    <Card className="gap-2">
      <CardTitle>Total {kind.label.toLowerCase()}</CardTitle>
      {failed ? (
        <ErrorState what={what} error={failed.error} />
      ) : !ready ? (
        <CardSkeleton what={what} />
      ) : (
        <>
          <p className="text-2xl font-semibold tracking-tight">{formatCurrency(sumAmounts(records.items))}</p>
          <p className="text-sm text-muted-foreground">
            {plural(records.items.length, 'record', 'records')} ·{' '}
            {plural(categories.items.length, kind.noun.toLowerCase(), kind.nounPlural)}
          </p>
        </>
      )}
    </Card>
  )
}

export function DashboardPage() {
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <NetWorthCard />
        {KINDS.map((k) => (
          <KindTotalCard key={k.kind} kind={k} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {KINDS.map((k) => (
          <SplitDonut key={k.kind} kind={k} />
        ))}
      </div>
    </div>
  )
}
