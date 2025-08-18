// Import styles
import "./src/styles/main.css";

// Import Alpine.js and dependencies
import Alpine from "alpinejs";
import L from "leaflet";
import Chart from "chart.js/auto";

// Import stores
import { activityStore } from "./src/stores/activityStore.js";
import { routeStore } from "./src/stores/routeStore.js";
import { appStore } from "./src/stores/appStore.js";

// Import components
import { MapComponent } from "./src/components/MapComponent.js";
import { ActivityForm } from "./src/components/ActivityForm.js";
import { StatsDisplay } from "./src/components/StatsDisplay.js";
import { ChartsComponent } from "./src/components/ChartsComponent.js";
import { GPXHandler } from "./src/components/GPXHandler.js";
import { LocationSelector } from "./src/components/LocationSelector.js";

// Make Leaflet and Chart.js globally available
window.L = L;
window.Chart = Chart;

// Setup Alpine.js components
Alpine.data("mapComponent", MapComponent);
Alpine.data("activityForm", ActivityForm);
Alpine.data("statsDisplay", StatsDisplay);
Alpine.data("chartsComponent", ChartsComponent);
Alpine.data("gpxHandler", GPXHandler);
Alpine.data("locationSelector", LocationSelector);

// Main app component
Alpine.data("app", () => ({
  init() {
    // Initialize theme
    this.$store.app.initTheme();

    // Trigger initial stats calculation after all components are ready
    setTimeout(() => {
      const statsEl = document.querySelector('[x-data*="statsDisplay"]');
      if (statsEl && statsEl._x_dataStack && statsEl._x_dataStack[0]) {
        const statsComponent = statsEl._x_dataStack[0];
        if (statsComponent.updateStats) {
          console.log("Triggering initial stats update");
          statsComponent.updateStats();
        }
      }
    }, 500);

    console.log("Strava GPX Generator - Alpine.js version initialized");
  },
}));

// Start Alpine.js
Alpine.start();

console.log("Alpine.js application started");
