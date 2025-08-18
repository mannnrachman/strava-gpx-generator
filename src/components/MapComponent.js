import { APIServices } from "../utils/api-services.js";

export function MapComponent() {
  return {
    map: null,
    routeLayer: null,

    init() {
      // Use $nextTick to ensure DOM is ready
      this.$nextTick(() => {
        this.initMap();
        this.setupEventListeners();
      });
    },

    initMap() {
      const mapElement = document.getElementById("map");

      // Check if map container exists and is not already initialized
      if (!mapElement) {
        console.error("Map container not found");
        return;
      }

      // Remove any existing map instance
      if (this.map) {
        this.map.remove();
        this.map = null;
      }

      // Clear the map container
      mapElement.innerHTML = "";

      try {
        // Initialize Leaflet map
        this.map = L.map("map", {
          attributionControl: true,
          zoomControl: true,
        }).setView([-3.3194, 114.5906], 13); // Default to Banjarmasin

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(this.map);

        this.routeLayer = L.layerGroup().addTo(this.map);

        // Store references in route store
        this.$store.route.setMap(this.map);
        this.$store.route.setRouteLayer(this.routeLayer);

        // Map click event to add route points
        this.map.on("click", (e) => this.addRoutePoint(e));

        console.log("Map initialized successfully");
      } catch (error) {
        console.error("Failed to initialize map:", error);
      }
    },

    setupEventListeners() {
      // Search functionality
      this.$watch("$store.app.searchQuery", (query) => {
        this.performSearch(query);
      });

      // Listen for redraw events
      this.$el.addEventListener("redraw-route", () => {
        this.drawRoute();
      });

      // Watch for route changes
      this.$watch("$store.route.points", () => {
        this.drawRoute();
      });

      // Listen for location selection from dropdown
      this.$el.addEventListener("location-selected", (event) => {
        this.handleLocationSelected(event.detail);
      });
    },

    handleLocationSelected(data) {
      const { location } = data;

      if (location && location.center) {
        // Set map view to selected location
        this.map.setView([location.center[0], location.center[1]], 12);

        // Show success message
        let locationText = location.name;
        if (location.state && location.country) {
          locationText = `${location.name}, ${location.state}, ${location.country}`;
        } else if (location.country) {
          locationText = `${location.name}, ${location.country}`;
        }

        this.$store.app.showAlert(
          `Location set to: ${locationText}`,
          "success"
        );
        console.log("Map centered to:", locationText);
      }
    },

    async addRoutePoint(e) {
      const { lat, lng } = e.latlng;
      console.log("Adding route point:", lat, lng);

      this.$store.route.addPoint(lat, lng);

      // Fetch elevation for all points when we have more than 1 point
      const points = this.$store.route.points;
      if (points.length > 1) {
        try {
          const elevationData = await APIServices.fetchElevationData(points);
          this.$store.route.setElevationData(elevationData);
        } catch (error) {
          console.warn("Failed to fetch elevation data:", error);
        }
      } else {
        // For first point, just get its elevation
        try {
          const elevation = await APIServices.fetchElevationData([[lat, lng]]);
          this.$store.route.setElevationData(elevation);
        } catch (error) {
          console.warn("Failed to fetch elevation data:", error);
        }
      }

      // Force redraw since Alpine reactive might not trigger immediately
      this.$nextTick(() => {
        this.drawRoute();
        this.updateStats();
      });
    },

    drawRoute() {
      if (!this.routeLayer) {
        console.warn("Route layer not initialized");
        return;
      }

      this.routeLayer.clearLayers();
      const points = this.$store.route.points;

      console.log("Drawing route with points:", points.length);

      if (points.length > 0) {
        // Draw markers for each point
        points.forEach((point, index) => {
          L.circleMarker(point, {
            radius: 6,
            color: "#3388ff",
            fillColor: "#3388ff",
            fillOpacity: 0.8,
          })
            .addTo(this.routeLayer)
            .bindPopup(`Point ${index + 1}`);
        });

        // Draw polyline connecting points
        if (points.length > 1) {
          const latlngs = points.map((p) => L.latLng(p[0], p[1]));
          L.polyline(latlngs, { color: "#ef4444", weight: 3 }).addTo(
            this.routeLayer
          );
        }
      }
    },

    clearRoute() {
      console.log("Clearing route");
      this.$store.route.clearRoute();

      // Force redraw to clear visual elements
      this.$nextTick(() => {
        this.drawRoute();
        this.updateStats();
      });
    },

    async alignToRoads() {
      const points = this.$store.route.points;
      const activityType = this.$store.activity.activityType;

      if (points.length < 2) {
        this.$store.app.showAlert(
          "Please draw a route with at least 2 points before aligning to roads.",
          "error"
        );
        return;
      }

      try {
        this.$store.app.setLoading(true);
        console.log("Original points before alignment:", points.length);

        const snappedPoints = await APIServices.snapRouteToRoads(
          points,
          activityType
        );
        console.log("Snapped points from API:", snappedPoints.length);

        console.log("Snapped points received:", snappedPoints.length);

        // Update route with snapped points (filtering sudah dilakukan di API service)
        this.$store.route.points = snappedPoints;

        // Fetch elevation for snapped points
        const elevationData = await APIServices.fetchElevationData(
          snappedPoints
        );
        this.$store.route.setElevationData(elevationData);

        this.$nextTick(() => {
          this.drawRoute();
          this.updateStats();
        });

        this.$store.app.showAlert(
          `Route successfully aligned to roads! (${snappedPoints.length} points)`,
          "success"
        );
      } catch (error) {
        console.error("Align to roads failed:", error);
        this.$store.app.showAlert(error.message, "error");
      } finally {
        this.$store.app.setLoading(false);
      }
    },

    async performSearch(query) {
      if (query.length < 3) {
        this.$store.app.setSearchResults([]);
        return;
      }

      try {
        const results = await APIServices.searchLocation(query);
        this.$store.app.setSearchResults(results);
      } catch (error) {
        console.error("Search failed:", error);
        this.$store.app.setSearchResults([]);
      }
    },

    selectSearchResult(place) {
      this.map.setView([place.lat, place.lon], 13);
      this.$store.app.searchQuery = place.display_name.split(",")[0];
      this.$store.app.clearSearch();
    },

    updateStats() {
      // Trigger stats recalculation directly
      const statsEl = document.querySelector('[x-data*="statsDisplay"]');
      if (statsEl) {
        // Force stats update via direct method call
        setTimeout(() => {
          const statsComponent = statsEl._x_dataStack[0];
          if (statsComponent && statsComponent.updateStats) {
            console.log("Triggering stats update");
            statsComponent.updateStats();
          }
        }, 100);
      }
    },

    destroy() {
      if (this.map) {
        this.map.remove();
        this.map = null;
        this.routeLayer = null;
      }
    },
  };
}
