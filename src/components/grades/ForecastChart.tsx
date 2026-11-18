import { formatGrade } from '@/lib/grade-calculation'
import type { ForecastWork } from '@/lib/grade-forecast'

export function ForecastChart({ current, remaining, expected, target }: { current: number; remaining: readonly ForecastWork[]; expected: Readonly<Record<string, number>>; target: number }) {
  const points = [{ projected: current, maximum: current, label: 'Сейчас' }]
  for (const work of remaining) {
    const previous = points[points.length - 1]
    points.push({ projected: previous.projected + (expected[work.id] ?? 0) * work.weight, maximum: previous.maximum + 10 * work.weight, label: work.title })
  }
  const top = Math.max(10, target, ...points.map(point => point.maximum))
  const x = (index: number) => 48 + index / Math.max(1, points.length - 1) * 624
  const y = (value: number) => 212 - value / top * 184
  const line = (key: 'projected' | 'maximum') => points.map((point, index) => `${x(index)},${y(point[key])}`).join(' ')
  return <figure className="forecast-chart">
    <figcaption>Как изменится результат</figcaption>
    <div className="forecast-chart-legend"><span className="forecast-chart-scenario">Твой сценарий</span><span className="forecast-chart-maximum">Максимум</span><span>Цель: {formatGrade(target)}</span></div>
    <svg viewBox="0 0 720 254" role="img" aria-label={`Результат по порядку оставшихся работ. Сейчас ${formatGrade(current)}, по сценарию ${formatGrade(points[points.length - 1].projected)}, максимально ${formatGrade(points[points.length - 1].maximum)}. Цель ${formatGrade(target)}.`}>
      {[0, top / 2, top].map(value => <g key={value}><line className="forecast-chart-grid" x1="48" x2="672" y1={y(value)} y2={y(value)} /><text x="36" y={y(value) + 4} textAnchor="end">{formatGrade(value)}</text></g>)}
      <line className="forecast-chart-target" x1="48" x2="672" y1={y(target)} y2={y(target)} />
      <polyline className="forecast-chart-max-line" points={line('maximum')} />
      <polyline className="forecast-chart-scenario-line" points={line('projected')} />
      {points.map((point, index) => <g key={index}><circle className="forecast-chart-point" cx={x(index)} cy={y(point.projected)} r="4"><title>{index ? `${index}. ${point.label}` : point.label}: {formatGrade(point.projected)}</title></circle>{(points.length <= 8 || index === 0 || index === points.length - 1) ? <text x={x(index)} y="240" textAnchor="middle">{index || 'Сейчас'}</text> : null}</g>)}
    </svg>
    <p>По горизонтали — работы в порядке списка ниже, по вертикали — накопленный вклад в результат до округления.</p>
    <details><summary>Значения на графике</summary><ol>{points.map((point, index) => <li key={index}>{point.label}: сценарий {formatGrade(point.projected)}, максимум {formatGrade(point.maximum)}</li>)}</ol></details>
  </figure>
}
