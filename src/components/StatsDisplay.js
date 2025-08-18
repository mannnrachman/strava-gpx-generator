import { Calculations } from '../utils/calculations.js'

export function StatsDisplay() {
  return {
    init() {
      this.$nextTick(() => {
        this.updateStats()
      })

      // Listen for stats update events
      this.$el.addEventListener('stats-update', () => {
        this.updateStats()
      })
      
      // Watch for route point changes
      this.$watch('$store.route.points', () => {
        console.log('Route points changed, updating stats')
        this.updateStats()
      })
      
      // Watch for activity changes
      this.$watch('$store.activity.paceMin', () => {
        this.updateStats()
      })
      this.$watch('$store.activity.paceSec', () => {
        this.updateStats()
      })
      this.$watch('$store.activity.avgHeartRate', () => {
        this.updateStats()
      })
      
      // Watch for variability slider changes - INI YANG PENTING!
      this.$watch('$store.activity.paceInconsistency', () => {
        console.log('Pace inconsistency changed:', this.$store.activity.paceInconsistency)
        this.updateStats()
      })
      this.$watch('$store.activity.hrVariability', () => {
        console.log('HR variability changed:', this.$store.activity.hrVariability)
        this.updateStats()
      })
      this.$watch('$store.activity.activityType', () => {
        this.updateStats()
      })
      this.$watch('$store.activity.units', () => {
        this.updateStats()
      })
    },

    updateStats() {
      const points = this.$store.route.points
      const elevationData = this.$store.route.elevationData
      const activity = this.$store.activity

      if (points.length < 2) {
        // Reset stats if no route
        activity.stats = {
          distance: '0.00 ' + (activity.units === 'km' ? 'km' : 'mi'),
          elevation: '0 m',
          pace: '0:00 ' + activity.paceFormat,
          duration: '00:00:00'
        }
        return
      }

      // Calculate distance
      const distance = Calculations.calculateDistance(points, activity.units)
      const unitLabel = activity.units === 'km' ? 'km' : 'mi'
      
      // Calculate elevation gain
      const elevationGain = Calculations.calculateElevationGain(elevationData)
      
      // Calculate pace and duration
      const { paceDisplay, durationDisplay } = Calculations.calculatePaceAndDuration(
        distance,
        activity.activityType,
        activity.paceMin,
        activity.paceSec,
        activity.units,
        activity.paceFormat
      )

      // Update stats in store
      activity.stats = {
        distance: `${distance.toFixed(2)} ${unitLabel}`,
        elevation: `${elevationGain} m`,
        pace: paceDisplay,
        duration: durationDisplay
      }

      // Always generate charts, even for single points (show at least demo data)
      this.generateCharts(distance)
    },

    generateCharts(distance) {
      const points = this.$store.route.points
      const activity = this.$store.activity

      // For demo purposes, generate charts even with minimal data
      const minDistance = Math.max(distance, 1) // At least 1km for chart demo
      
      console.log('Generating charts for distance:', minDistance, 'points:', points.length)

      const chartData = Calculations.generateChartData(
        points.length >= 2 ? points : [[-3.3194, 114.5906], [-3.3200, 114.5920]], // Use demo points if needed
        minDistance,
        activity.activityType,
        activity.paceMin,
        activity.paceSec,
        activity.avgHeartRate,
        activity.paceInconsistency,
        activity.hrVariability,
        activity.units,
        activity.paceFormat
      )

      if (chartData) {
        // Dispatch to charts component
        const chartsEl = document.getElementById('charts-container')
        if (chartsEl) {
          console.log('Dispatching chart update with data:', chartData)
          chartsEl.dispatchEvent(new CustomEvent('update-charts', { 
            detail: chartData,
            bubbles: true 
          }))
        } else {
          console.warn('Charts container not found')
        }
      } else {
        console.warn('No chart data generated')
      }
    }
  }
}