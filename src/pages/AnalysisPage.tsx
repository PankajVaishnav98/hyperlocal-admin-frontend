import { useMemo, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Card } from '../components/ui/Primitives'
import { ErrorState, LoadingState } from '../components/states/SystemStates'
import { formatPaise, getAnalysis } from '../features/ops/api'
import { PageHeader } from '../features/ops/ui'

function todayYmd(timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function daysAgoYmd(days: number, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(Date.now() - days * 86_400_000))
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <Card className="p-5">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-ink-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-ink-950">{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink-500">{hint}</p> : null}
    </Card>
  )
}

export function AnalysisPage() {
  const timeZone = 'Asia/Kolkata'
  const [from, setFrom] = useState(() => daysAgoYmd(29, timeZone))
  const [to, setTo] = useState(() => todayYmd(timeZone))
  const query = useQuery({
    queryKey: ['admin', 'analysis', from, to, timeZone],
    queryFn: () => getAnalysis({ from, to, timeZone }),
    placeholderData: keepPreviousData,
  })
  const heatMax = useMemo(() => {
    return Math.max(1, ...(query.data?.heatmap.map((cell) => cell.count) ?? [0]))
  }, [query.data])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analysis"
        description="Merchandise revenue excludes delivery. Profit is revenue minus product cost snapshots, not delivery fees."
      />
      <Card className="flex flex-wrap items-end gap-4 p-5">
        <label className="space-y-1 text-sm font-semibold text-ink-800">
          From
          <input
            type="date"
            className="mt-1 block h-11 rounded-xl border border-ink-200 px-3 text-sm font-normal"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
        </label>
        <label className="space-y-1 text-sm font-semibold text-ink-800">
          To
          <input
            type="date"
            className="mt-1 block h-11 rounded-xl border border-ink-200 px-3 text-sm font-normal"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
        </label>
        <p className="pb-2 text-xs text-ink-500">Times use {timeZone}. Live order events refresh this page.</p>
      </Card>
      {query.isLoading && !query.data ? <LoadingState label="Loading analysis" /> : null}
      {query.error ? (
        <ErrorState title="Could not load analysis" onRetry={() => void query.refetch()} />
      ) : null}
      {query.data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              label="Merchandise revenue"
              value={formatPaise(query.data.range.merchandiseRevenuePaise)}
              hint={`Today ${formatPaise(query.data.todayMetrics.merchandiseRevenuePaise)}`}
            />
            <Metric
              label="Delivery fees"
              value={formatPaise(query.data.range.deliveryFeePaise)}
              hint={`Today ${formatPaise(query.data.todayMetrics.deliveryFeePaise)} · not in revenue`}
            />
            <Metric
              label="Platform profit"
              value={formatPaise(query.data.range.profitPaise)}
              hint={
                query.data.range.profitComplete
                  ? `Today ${formatPaise(query.data.todayMetrics.profitPaise)}`
                  : `${query.data.range.linesMissingCost} lines missing cost`
              }
            />
            <Metric
              label="Orders"
              value={String(query.data.range.orderCount)}
              hint={`Today ${query.data.todayMetrics.orderCount}`}
            />
          </div>
          {!query.data.range.profitComplete ? (
            <p className="text-sm text-ink-600">
              Profit is incomplete until every sold line has cost. Set cost on the product form; new
              orders snapshot that cost.
            </p>
          ) : null}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-ink-900">Orders by weekday</h2>
              <div className="mt-4 h-64 w-full">
                <ResponsiveContainer width="99%" height={256}>
                  <BarChart data={query.data.ordersByWeekday}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E7E4DC" />
                    <XAxis dataKey="label" tick={{ fill: '#6B675E', fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fill: '#6B675E', fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2F6B4F" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-ink-900">Orders by hour</h2>
              <div className="mt-4 h-64 w-full">
                <ResponsiveContainer width="99%" height={256}>
                  <BarChart data={query.data.ordersByHour}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E7E4DC" />
                    <XAxis dataKey="hour" tick={{ fill: '#6B675E', fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fill: '#6B675E', fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3F7A8C" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-ink-900">Order heatmap</h2>
            <p className="mt-1 text-xs text-ink-500">Weekday rows, hour columns, all placed orders in range.</p>
            <div className="mt-4 overflow-x-auto">
              <div
                className="grid gap-1"
                style={{ gridTemplateColumns: `2.5rem repeat(24, minmax(0.7rem, 1fr))` }}
              >
                <span />
                {Array.from({ length: 24 }, (_, hour) => (
                  <span key={hour} className="text-center text-[0.6rem] text-ink-400">
                    {hour}
                  </span>
                ))}
                {query.data.ordersByWeekday.map((day) => (
                  <HeatRow
                    key={day.weekday}
                    label={day.label}
                    weekday={day.weekday}
                    cells={query.data.heatmap.filter((cell) => cell.weekday === day.weekday)}
                    max={heatMax}
                  />
                ))}
              </div>
            </div>
          </Card>
          <div className="grid gap-4 lg:grid-cols-2">
            <RankTable title="Top products" rows={query.data.topProducts} />
            <RankTable title="Top categories" rows={query.data.topCategories} />
          </div>
        </>
      ) : null}
    </div>
  )
}

function HeatRow({
  label,
  weekday,
  cells,
  max,
}: {
  label: string
  weekday: number
  cells: Array<{ hour: number; count: number }>
  max: number
}) {
  return (
    <>
      <span className="self-center text-[0.65rem] font-semibold text-ink-500">{label}</span>
      {Array.from({ length: 24 }, (_, hour) => {
        const count = cells.find((cell) => cell.hour === hour)?.count ?? 0
        const alpha = count === 0 ? 0.06 : 0.18 + (count / max) * 0.82
        return (
          <span
            key={`${weekday}-${hour}`}
            title={`${label} ${hour}:00 · ${count}`}
            className="h-4 rounded-sm"
            style={{ backgroundColor: `rgba(47, 107, 79, ${alpha})` }}
          />
        )
      })}
    </>
  )
}

function RankTable({
  title,
  rows,
}: {
  title: string
  rows: Array<{ id: string; name: string; quantity: number; merchandisePaise: number }>
}) {
  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-ink-900">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-ink-500">No sold items in this range.</p>
      ) : (
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-ink-400">
              <th className="py-2 font-semibold">Name</th>
              <th className="py-2 font-semibold">Qty</th>
              <th className="py-2 font-semibold">Merchandise</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-ink-100">
                <td className="py-2 text-ink-900">{row.name}</td>
                <td className="py-2">{row.quantity}</td>
                <td className="py-2">{formatPaise(row.merchandisePaise)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  )
}
