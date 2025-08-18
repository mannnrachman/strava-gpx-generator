export function ChartsComponent() {
  // Store chart instances outside Alpine's reactivity to prevent issues
  let paceChart = null
  let hrChart = null
  
  return {
    init() {
      // Use $nextTick to ensure DOM is ready
      this.$nextTick(() => {
        this.setupEventListeners()
        
        // Show initial demo charts
        setTimeout(() => {
          console.log('Initializing demo charts')
          this.createDemoCharts()
        }, 1000)
      })
    },

    setupEventListeners() {
      this.$el.addEventListener('update-charts', (event) => {
        console.log('Received chart update event:', event.detail)
        this.updateCharts(event.detail)
      })

      // Apply theme when charts are created
      this.$watch('$store.app.isDarkMode', () => {
        this.applyThemeToCharts()
      })
    },

    updateCharts(chartData) {
      if (!chartData || !chartData.pace || !chartData.heartRate) {
        console.warn('Invalid chart data received:', chartData)
        return
      }
      
      this.renderChart(
        'paceChart',
        chartData.pace.label,
        chartData.pace.labels,
        chartData.pace.data,
        'rgb(234, 88, 12)',
        chartData.pace.formatter,
        'pace'
      )
      
      this.renderChart(
        'hrChart',
        chartData.heartRate.label,
        chartData.heartRate.labels,
        chartData.heartRate.data,
        'rgb(220, 38, 38)',
        null,
        'hr'
      )
    },

    renderChart(canvasId, label, labels, data, color, yTicksCallback, type) {
      const instance = type === 'pace' ? paceChart : hrChart
      const canvas = document.getElementById(canvasId)
      
      if (!canvas) {
        console.warn(`Canvas element ${canvasId} not found`)
        return
      }
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        console.warn(`Could not get 2D context for ${canvasId}`)
        return
      }

      // Destroy existing chart first to prevent conflicts
      if (instance) {
        try {
          instance.destroy()
        } catch (e) {
          console.warn('Error destroying chart:', e)
        }
      }

      // Always create a new chart
      const bgColor = color.includes('rgb(')
        ? color.replace('rgb(', 'rgba(').replace(')', ', 0.15)')
        : color
        
      const chartConfig = {
        type: 'line',
        data: {
          labels: [...labels], // Clone to avoid reactivity issues
          datasets: [
            {
              label: label,
              data: [...data], // Clone to avoid reactivity issues
              borderColor: color,
              backgroundColor: bgColor,
              fill: true,
              tension: 0.35,
              pointRadius: 0,
              pointHoverRadius: 3,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            intersect: false,
          },
          layout: { padding: 8 },
          plugins: {
            legend: { display: false },
            tooltip: {
              mode: 'index',
              intersect: false,
              callbacks: {
                label: (ctx) => {
                  const v = ctx.parsed.y
                  if (type === 'pace' && yTicksCallback) {
                    return yTicksCallback(v)
                  }
                  return type === 'hr' ? `HR: ${v} bpm` : `${v}`
                },
              },
            },
          },
          scales: {
            y: {
              beginAtZero: false,
              ticks: {
                callback: yTicksCallback || undefined,
                color: '#6b7280',
              },
              grid: { color: '#e5e7eb' },
            },
            x: {
              ticks: { maxTicksLimit: 8, color: '#6b7280' },
              grid: { color: '#f1f5f9' },
            },
          },
        },
      }

      try {
        const newChart = new Chart(ctx, chartConfig)
        
        // Store the new chart instance outside Alpine's reactivity
        if (type === 'pace') {
          paceChart = newChart
        } else {
          hrChart = newChart
        }
        
        console.log(`${type} chart created successfully`)
      } catch (error) {
        console.error(`Failed to create ${type} chart:`, error)
      }
    },

    applyThemeToCharts() {
      const isDark = this.$store.app.isDarkMode
      const axis = isDark ? '#cbd5e1' : '#6b7280' // slate-300 vs gray-500
      const gridY = isDark ? '#334155' : '#e5e7eb' // slate-700 vs gray-200
      const gridX = isDark ? '#1f2937' : '#f1f5f9' // gray-800 vs slate-50

      // Use external chart instances to avoid Alpine reactivity issues
      const charts = [paceChart, hrChart].filter(Boolean)
      
      charts.forEach((chart) => {
        try {
          if (chart && chart.options && chart.options.scales) {
            chart.options.scales.x.ticks.color = axis
            chart.options.scales.y.ticks.color = axis
            chart.options.scales.x.grid.color = gridX
            chart.options.scales.y.grid.color = gridY
            chart.update()
          }
        } catch (error) {
          console.warn('Error applying theme to chart:', error)
        }
      })
    },

    togglePaceChart() {
      this.$store.app.togglePaceChart()
      if (this.$store.app.showPaceChart && paceChart) {
        setTimeout(() => paceChart.resize(), 50)
      }
    },

    toggleHrChart() {
      this.$store.app.toggleHrChart()
      if (this.$store.app.showHrChart && hrChart) {
        setTimeout(() => hrChart.resize(), 50)
      }
    },

    createDemoCharts() {
      // Create demo charts with sample data
      const demoLabels = ['0.5 km', '1.0 km', '1.5 km', '2.0 km', '2.5 km']
      const demoPaceData = [5.0, 5.2, 4.8, 5.1, 5.3]
      const demoHrData = [145, 150, 148, 152, 149]
      
      console.log('Creating demo pace chart')
      this.renderChart(
        'paceChart',
        'Pace (min/km)',
        demoLabels,
        demoPaceData,
        'rgb(234, 88, 12)',
        (value) => {
          const minutes = Math.floor(value)
          const seconds = Math.round((value - minutes) * 60)
          return `${minutes}:${seconds.toString().padStart(2, '0')}`
        },
        'pace'
      )
      
      console.log('Creating demo HR chart')
      this.renderChart(
        'hrChart',
        'Heart Rate (bpm)',
        demoLabels,
        demoHrData,
        'rgb(220, 38, 38)',
        null,
        'hr'
      )
    },

    destroy() {
      if (paceChart) {
        try {
          paceChart.destroy()
        } catch (e) {
          console.warn('Error destroying pace chart:', e)
        }
        paceChart = null
      }
      if (hrChart) {
        try {
          hrChart.destroy()
        } catch (e) {
          console.warn('Error destroying HR chart:', e)
        }
        hrChart = null
      }
    }
  }
}