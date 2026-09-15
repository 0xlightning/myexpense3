import { useId, useMemo } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { ErrorState, LoadingLabel } from '@/components/States'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useColorScheme } from '@/hooks/useColorScheme'
import { buildSplit, sortByCreation, type Slice } from '@/lib/derive'
import { formatCurrency, formatShare, plural } from '@/lib/format'
import type { KindMeta } from '@/lib/kinds'
import { SLOT_COUNT, SURFACE, slotColor } from '@/lib/palette'
import { useCategories, useRecords } from '@/store'

export function SplitDonut({ kind }: { kind: KindMeta }) {
  const records = useRecords(kind)
  const categories = useCategories(kind)
  const scheme = useColorScheme()
  const titleId = useId()
  const split = useMemo(() => buildSplit(records.items, categories.items), [records.items, categories.items])

  const failed = [records, categories].find((s) => s.status === 'error')
  const loading = records.status === 'loading' || categories.status === 'loading'
  const noun = kind.noun.toLowerCase()
  const single = split.slices.length === 1 ? split.slices[0] : null
  const title = single ? `${kind.label}: ${single.name}` : `${kind.label} by ${noun}`

  const legendSlices = useMemo(() => {
    if (split.slices.length > 0) return split.slices
    const sorted = sortByCreation(categories.items)
    return sorted.map((c, index) => ({
      key: c.id,
      name: c.name,
      value: 0,
      slot: index < SLOT_COUNT ? index : null,
    }))
  }, [split.slices, categories.items])

  const chartSlices = useMemo(() => {
    if (split.total === 0 || split.slices.length === 0) {
      return [{ key: '__empty__', name: 'No data', value: 1, slot: null as number | null }]
    }
    return split.slices
  }, [split.slices, split.total])

  return (
    <Card aria-labelledby={titleId} className="p-5 rounded-2xl border-border/70 shadow-xs flex flex-col justify-between">
      <CardHeader className="p-0 pb-3">
        <CardTitle id={titleId} className="text-base font-bold tracking-tight">
          {title}
        </CardTitle>
      </CardHeader>

      {failed ? (
        <ErrorState what={`${kind.label.toLowerCase()} split`} error={failed.error} />
      ) : loading ? (
        <div className="py-4 grid gap-3">
          <LoadingLabel what={`${kind.label.toLowerCase()} split`} />
          <Skeleton className="mx-auto size-44 rounded-full" />
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="relative h-52">
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xl font-extrabold tracking-tight text-foreground">{formatCurrency(split.total)}</span>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{kind.label}</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartSlices}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="60%"
                  outerRadius="78%"
                  startAngle={90}
                  endAngle={-270}
                  stroke={SURFACE[scheme]}
                  strokeWidth={2.5}
                  isAnimationActive={false}
                  labelLine={false}
                  label={false}
                >
                  {chartSlices.map((s) => (
                    <Cell
                      key={s.key}
                      fill={s.key === '__empty__' || split.total === 0 ? 'hsl(var(--border))' : slotColor(s.slot, scheme)}
                    />
                  ))}
                </Pie>
                <Tooltip
                  wrapperStyle={{ outline: 'none' }}
                  content={({ active, payload }) => {
                    const slice = active ? (payload?.[0]?.payload as Slice | undefined) : undefined
                    if (!slice || slice.key === '__empty__' || split.total === 0) return null
                    return (
                      <div className="rounded-xl border border-border/80 bg-card p-3 text-xs shadow-xl">
                        <p className="font-bold text-foreground mb-0.5">{slice.name}</p>
                        <p className="text-muted-foreground font-medium">
                          {formatCurrency(slice.value)} · {formatShare(slice.value / split.total)}
                        </p>
                      </div>
                    )
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="grid gap-2 text-xs pt-1 border-t border-border/50" aria-label={`${title} legend`}>
            {legendSlices.map((s) => (
              <li key={s.key} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    aria-hidden
                    className="size-2.5 shrink-0 rounded-full shadow-xs"
                    style={{ backgroundColor: s.slot === null ? 'hsl(var(--muted-foreground))' : slotColor(s.slot, scheme) }}
                  />
                  <span className="min-w-0 truncate font-semibold text-foreground">{s.name}</span>
                </div>
                <span className="font-medium tabular-nums text-muted-foreground shrink-0">{formatCurrency(s.value)}</span>
              </li>
            ))}
          </ul>

          {split.emptyCategoryCount > 0 && split.slices.length > 0 && (
            <p className="text-[11px] text-muted-foreground italic text-center pt-1">
              {plural(split.emptyCategoryCount, noun, kind.nounPlural)} with no records yet
            </p>
          )}
        </div>
      )}
    </Card>
  )
}

