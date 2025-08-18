import Alpine from 'alpinejs'

export const routeStore = Alpine.store('route', {
  // Route data
  points: [],
  elevationData: [],
  timestamps: [],
  heartRates: [],
  
  // Map state
  map: null,
  routeLayer: null,
  
  // Chart instances
  paceChart: null,
  hrChart: null,
  
  // Methods
  addPoint(lat, lng) {
    this.points.push([lat, lng])
  },
  
  clearRoute() {
    this.points = []
    this.elevationData = []
    this.timestamps = []
    this.heartRates = []
    
    if (this.routeLayer) {
      this.routeLayer.clearLayers()
    }
    
    // Destroy charts
    if (this.paceChart) {
      this.paceChart.destroy()
      this.paceChart = null
    }
    if (this.hrChart) {
      this.hrChart.destroy()
      this.hrChart = null
    }
  },
  
  setElevationData(elevations) {
    this.elevationData = elevations
  },
  
  loadFromGPX(points, elevations, timestamps, heartRates) {
    this.points = points
    this.elevationData = elevations
    this.timestamps = timestamps || []
    this.heartRates = heartRates || []
  },
  
  getDistance() {
    if (this.points.length < 2) return 0
    
    let totalDistance = 0
    for (let i = 0; i < this.points.length - 1; i++) {
      const p1 = L.latLng(this.points[i][0], this.points[i][1])
      const p2 = L.latLng(this.points[i + 1][0], this.points[i + 1][1])
      totalDistance += p1.distanceTo(p2) // meters
    }
    return totalDistance / 1000 // kilometers
  },
  
  getElevationGain() {
    if (this.elevationData.length < 2) return 0
    
    let totalGain = 0
    for (let i = 1; i < this.elevationData.length; i++) {
      const elevationDiff = this.elevationData[i] - this.elevationData[i - 1]
      if (elevationDiff > 0) {
        totalGain += elevationDiff
      }
    }
    return Math.round(totalGain)
  },
  
  setMap(map) {
    this.map = map
  },
  
  setRouteLayer(layer) {
    this.routeLayer = layer
  }
})