'use client'

import { useEffect, useState } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import type { Venta, PaginatedResponse } from '@/types/ventasCobranzas'

// Registrar componentes de Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

type Range = '7d' | '30d' | '90d'
type GroupBy = 'day' | 'week' | 'month'

interface VentasChartState {
  labels: string[]
  data: number[]
}

export function VentasChart() {
  const [range, setRange] = useState<Range>('30d')
  const [groupBy, setGroupBy] = useState<GroupBy>('day')
  const [state, setState] = useState<VentasChartState>({ labels: [], data: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, groupBy])

  const loadStats = async () => {
    setLoading(true)
    setError(null)

    try {
      const now = new Date()
      const start = new Date(now)

      if (range === '7d') start.setDate(now.getDate() - 7)
      if (range === '30d') start.setDate(now.getDate() - 30)
      if (range === '90d') start.setDate(now.getDate() - 90)

      const startISO = start.toISOString().slice(0, 10) // yyyy-mm-dd

      const url = `/api/ventas?limit=1000&sort=fecha&where[fecha][greater_than_or_equal]=${startISO}&depth=0`

      const res = await fetch(url, { credentials: 'include' })
      if (!res.ok) {
        if (res.status === 403) throw new Error('No tienes permisos para ver Ventas')
        throw new Error('Error al cargar estadísticas de Ventas')
      }

      const data: PaginatedResponse<Venta> = await res.json()
      const agg = aggregateByGroup(data.docs, groupBy)

      setState({
        labels: agg.labels,
        data: agg.values,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
      setState({ labels: [], data: [] })
    } finally {
      setLoading(false)
    }
  }

  const chartData = {
    labels: state.labels,
    datasets: [
      {
        label: 'Total vendido',
        data: state.data,
        fill: true,
        borderColor: 'rgb(37,99,235)',
        backgroundColor: 'rgba(37,99,235,0.2)',
        tension: 0.3,
        pointRadius: 3,
      },
    ],
  }

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `Total: $${Number(ctx.parsed.y ?? 0).toFixed(2)}`,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 0,
          autoSkip: true,
        },
      },
      y: {
        beginAtZero: true,
      },
    },
  }

  return (
    <div className="ventas-chart">
      <div className="ventas-chart__header">
        <div>
          <h2>Evolución de ventas</h2>
          <p className="ventas-chart__subtitle">Total vendido agrupado por período de tiempo.</p>
        </div>
        <div className="ventas-chart__filters">
          <div className="ventas-chart__filter-group">
            <span>Rango:</span>
            <button
              type="button"
              className={range === '7d' ? 'primary small' : 'secondary small'}
              onClick={() => setRange('7d')}
            >
              7 días
            </button>
            <button
              type="button"
              className={range === '30d' ? 'primary small' : 'secondary small'}
              onClick={() => setRange('30d')}
            >
              30 días
            </button>
            <button
              type="button"
              className={range === '90d' ? 'primary small' : 'secondary small'}
              onClick={() => setRange('90d')}
            >
              90 días
            </button>
          </div>
          <div className="ventas-chart__filter-group">
            <span>Agrupar por:</span>
            <button
              type="button"
              className={groupBy === 'day' ? 'primary small' : 'secondary small'}
              onClick={() => setGroupBy('day')}
            >
              Día
            </button>
            <button
              type="button"
              className={groupBy === 'week' ? 'primary small' : 'secondary small'}
              onClick={() => setGroupBy('week')}
            >
              Semana
            </button>
            <button
              type="button"
              className={groupBy === 'month' ? 'primary small' : 'secondary small'}
              onClick={() => setGroupBy('month')}
            >
              Mes
            </button>
          </div>
        </div>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <div className="ventas-chart__body">
        {loading ? (
          <div className="full-page-center">
            <div className="spinner" />
          </div>
        ) : state.labels.length === 0 ? (
          <p className="ventas-chart__empty">No hay datos suficientes en el rango seleccionado.</p>
        ) : (
          <Line data={chartData} options={options} />
        )}
      </div>
    </div>
  )
}

/* ===== Helpers ===== */

function aggregateByGroup(
  ventas: Venta[],
  groupBy: GroupBy,
): {
  labels: string[]
  values: number[]
} {
  const map = new Map<string, number>()

  for (const v of ventas) {
    if (!v.fecha || v.total == null) continue
    const d = new Date(v.fecha)
    let key: string

    if (groupBy === 'day') {
      key = d.toISOString().slice(0, 10) // yyyy-mm-dd
    } else if (groupBy === 'month') {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      key = `${y}-${m}`
    } else {
      key = getISOWeekKey(d) // semana ISO
    }

    const current = map.get(key) ?? 0
    map.set(key, current + Number(v.total ?? 0))
  }

  const labels = Array.from(map.keys()).sort()
  const values = labels.map((l) => map.get(l) ?? 0)

  return { labels, values }
}

// Semana ISO: YYYY-Wxx
function getISOWeekKey(date: Date): string {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = tmp.getUTCDay() || 7
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}
