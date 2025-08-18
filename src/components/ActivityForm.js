export function ActivityForm() {
  return {
    init() {
      // Set default date and time
      const now = new Date()
      this.$store.activity.date = now.toISOString().split('T')[0]
      this.$store.activity.startTime = now.toTimeString().split(' ')[0].substring(0, 5)
    },

    updateActivityType(type) {
      this.$store.activity.updateActivityType(type)
      this.$dispatch('stats-update')
    },

    updateUnits(units) {
      this.$store.activity.updateUnits(units)
      this.$dispatch('stats-update')
    },

    updatePaceFormat(format) {
      this.$store.activity.paceFormat = format
      this.$dispatch('stats-update')
    },

    onFormChange() {
      this.$dispatch('stats-update')
    },

    get currentDistanceUnitLabel() {
      return this.$store.activity.units === 'km' ? 'Kilometers (km)' : 'Miles (mi)'
    },

    get paceTypeLabel() {
      const config = this.$store.activity.activityConfigs[this.$store.activity.activityType]
      return config.paceType
    },

    get isCycling() {
      return this.$store.activity.activityType === 'cycling'
    },

    get paceFormatLabel() {
      if (this.isCycling) {
        return this.$store.activity.units === 'km' ? 'km/h' : 'mph'
      }
      return this.$store.activity.paceFormat
    }
  }
}