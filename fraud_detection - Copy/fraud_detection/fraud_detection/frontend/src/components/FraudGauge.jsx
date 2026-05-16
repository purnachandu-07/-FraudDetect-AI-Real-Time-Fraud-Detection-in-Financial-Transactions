import { useEffect, useRef, useState } from 'react'
import { Chart, ArcElement, DoughnutController, Tooltip } from 'chart.js'
Chart.register(ArcElement, DoughnutController, Tooltip)

export default function FraudGauge({ value = 0, label = 'Fraud Rate' }) {
  const canvasRef = useRef(null)
  const chartRef = useRef(null)
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return

    if (chartRef.current) {
      chartRef.current.destroy()
    }

    const pct = Math.min(Math.max(value, 0), 100)
    const color =
      pct >= 20 ? '#ef4444' :
      pct >= 10 ? '#f59e0b' :
                  '#10b981'

    chartRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [pct, 100 - pct],
          backgroundColor: [color, 'rgba(255,255,255,0.05)'],
          borderWidth: 0,
          borderRadius: 4,
          hoverBorderWidth: 0,
        }],
      },
      options: {
        cutout: '78%',
        rotation: -90,
        circumference: 180,
        plugins: { tooltip: { enabled: false }, legend: { display: false } },
        animation: { duration: 800, easing: 'easeOutQuart' },
      },
    })
    setDisplayValue(pct)

    return () => chartRef.current?.destroy()
  }, [value])

  const color =
    displayValue >= 20 ? 'text-danger-400' :
    displayValue >= 10 ? 'text-warning-400' :
                          'text-success-400'

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-44 h-24">
        <canvas ref={canvasRef} />
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span className={`text-3xl font-bold ${color}`}>{displayValue.toFixed(1)}%</span>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  )
}
