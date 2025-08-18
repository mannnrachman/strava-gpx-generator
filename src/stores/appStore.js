import Alpine from 'alpinejs'

export const appStore = Alpine.store('app', {
  // UI state
  isDarkMode: false,
  showPaceChart: true,
  showHrChart: true,
  isLoading: false,
  
  // Search state
  searchQuery: '',
  searchResults: [],
  showSearchResults: false,
  
  // Alert system
  alert: {
    show: false,
    message: '',
    type: 'info' // 'info', 'success', 'error'
  },
  
  // Methods
  toggleTheme() {
    this.isDarkMode = !this.isDarkMode
    document.documentElement.classList.toggle('dark', this.isDarkMode)
    
    try {
      localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light')
    } catch (e) {
      console.warn('Could not save theme preference')
    }
  },
  
  initTheme() {
    try {
      const saved = localStorage.getItem('theme')
      if (saved) {
        this.isDarkMode = saved === 'dark'
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        this.isDarkMode = true
      }
      document.documentElement.classList.toggle('dark', this.isDarkMode)
    } catch (e) {
      console.warn('Could not load theme preference')
    }
  },
  
  showAlert(message, type = 'info', duration = 3000) {
    this.alert = {
      show: true,
      message,
      type
    }
    
    setTimeout(() => {
      this.alert.show = false
    }, duration)
  },
  
  hideAlert() {
    this.alert.show = false
  },
  
  togglePaceChart() {
    this.showPaceChart = !this.showPaceChart
  },
  
  toggleHrChart() {
    this.showHrChart = !this.showHrChart
  },
  
  setSearchResults(results) {
    this.searchResults = results
    this.showSearchResults = results.length > 0
  },
  
  clearSearch() {
    this.searchQuery = ''
    this.searchResults = []
    this.showSearchResults = false
  },
  
  setLoading(loading) {
    this.isLoading = loading
  }
})