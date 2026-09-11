import { useId, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, type PieLabelRenderProps } from 'recharts'
import { EmptyState, ErrorState, LoadingLabel } from '@/components/States'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useColorScheme } from '@/hooks/useColorScheme'
import { buildSplit, type Slice } from '@/lib/derive'
import { formatCurrency, formatShare, plural } from '@/lib/format'
import type { KindMeta } from '@/lib/kinds'
import { SURFACE, slotColor } from '@/lib/palette'
import { useCategories, useRecords } from '@/store'

const DIRECT_LABEL_MAX = 4
const RADIAN = Math.PI / 180

const truncate = (s: string, max = 14) => (s.length > max ? `${s.slice(0, max - 1)}…` : s)

// Direct labels stay in ink, never the series colour.
function renderLabel({ cx, cy, midAngle, outerRadius, name }: PieLabelRenderProps) {
  const radius = Number(outerRadius) + 10
  const angle = -Number(midAngle ?? 0) * RADIAN
  const x = Number(cx) + radius * Math.cos(angle)
  const y = Number(cy) + radius * Math.sin(angle)
  return (
    <text
      x={x}
      y={y}
      textAnchor={x >= Number(cx) ? 'start' : 'end'}
      dominantBaseline="central"
      className="fill-foreground text-xs"
    >
      {truncate(String(name))}
    </text>
  )
}

export function SplitDonut({ kind }: { kind: KindMeta }) {
  const records = useRecords(kind)
  const categories = useCategories(kind)
  const scheme = useColorScheme()
  const [showTable, setShowTable] = useState(false)
  const titleId = useId()
  const tableId = useId()
  const split = useMemo(() => buildSplit(records.items, categories.items), [records.items, categories.items])

  const failed = [records, categories].find((s) => s.status === 'error')
  const loading = records.status === 'loading' || categories.status === 'loading'
  const noun = kind.noun.toLowerCase()
  const single = split.slices.length === 1 ? split.slices[0] : null
  const title = single ? `${kind.label}: ${single.name}` : `${kind.label} by ${noun}`

  return (
    <Card aria-labelledby={titleId}>
      <CardHeader>
        <CardTitle id={titleId}>{title}</CardTitle>
      </CardHeader>

      {failed ? (
        <ErrorState what={`${kind.label.toLowerCase()} split`} error={failed.error} />
      ) : loading ? (
        <>
          <LoadingLabel what={`${kind.label.toLowerCase()} split`} />
          <Skeleton className="mx-auto my-4 size-44 rounded-full" />
        </>
      ) : split.total === 0 ? (
        <EmptyState className="grid min-h-56 content-center gap-1">
          <p>No {kind.label.toLowerCase()} recorded yet.</p>
          <p>
            <Link className="font-medium text-foreground underline underline-offset-4" to={kind.path}>
              Add a record
            </Link>{' '}
            or{' '}
            <Link className="font-medium text-foreground underline underline-offset-4" to="/category">
              set up {kind.nounPlural}
            </Link>
            .
          </p>
        </EmptyState>
      ) : (
        <>
          <div className="relative h-56">
            {/* Centre: bucket total + kind label. Before the chart so tooltips paint above it. */}
            <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
              <span className="text-lg font-semibold">{formatCurrency(split.total)}</span>
              <span className="text-xs text-muted-foreground">{kind.label}</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={split.slices}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="56%"
                  outerRadius="74%"
                  startAngle={90}
                  endAngle={-270}
                  stroke={SURFACE[scheme]}
                  strokeWidth={2}
                  isAnimationActive={false}
                  labelLine={false}
                  label={split.slices.length <= DIRECT_LABEL_MAX ? renderLabel : false}
                >
                  {split.slices.map((s) => (
                    <Cell key={s.key} fill={slotColor(s.slot, scheme)} />
                  ))}
                </Pie>
                <Tooltip
                  wrapperStyle={{ outline: 'none' }}
                  content={({ active, payload }) => {
                    const slice = active ? (payload?.[0]?.payload as Slice | undefined) : undefined
                    if (!slice) return null
                    return (
                      <div className="rounded-md border bg-background px-3 py-2 text-sm shadow-md">
                        <p className="font-medium">{slice.name}</p>
                        <p className="text-muted-foreground">
                          {formatCurrency(slice.value)} · {formatShare(slice.value / split.total)}
                        </p>
                      </div>
                    )
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {!single && (
            <ul className="grid gap-1.5 text-sm" aria-label={`${title} legend`}>
              {split.slices.map((s) => (
                <li key={s.key} className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="size-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: slotColor(s.slot, scheme) }}
                  />
                  <span className="min-w-0 flex-1 truncate">{s.name}</span>
                  <span>{formatCurrency(s.value)}</span>
                </li>
              ))}
            </ul>
          )}

          {split.emptyCategoryCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {plural(split.emptyCategoryCount, noun, kind.nounPlural)} with no records yet
            </p>
          )}

          <div>
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3"
              aria-expanded={showTable}
              aria-controls={tableId}
              onClick={() => setShowTable((v) => !v)}
            >
              {showTable ? 'Hide table' : 'Show as table'}
            </Button>
            <table id={tableId} hidden={!showTable} className="mt-2 w-full text-sm">
              <caption className="sr-only">{title}</caption>
              <thead>
                <tr className="text-muted-foreground">
                  <th scope="col" className="py-1.5 text-left font-medium">
                    {kind.noun}
                  </th>
                  <th scope="col" className="py-1.5 text-right font-medium">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {split.rows.map((row) => (
                  <tr key={row.key} className="border-t">
                    <td className="py-1.5">{row.name}</td>
                    <td className="py-1.5 text-right tabular-nums">{formatCurrency(row.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  )
}
