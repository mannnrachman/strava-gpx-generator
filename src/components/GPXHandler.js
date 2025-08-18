import { GPXParser } from "../utils/gpx-parser.js";

export function GPXHandler() {
  return {
    init() {
      // Setup file input handler
      const fileInput = document.getElementById("gpxFileInput");
      if (fileInput) {
        fileInput.addEventListener("change", (e) => this.handleFileImport(e));
      }
    },

    triggerImport() {
      const fileInput = document.getElementById("gpxFileInput");
      if (fileInput) {
        fileInput.click();
      }
    },

    async handleFileImport(event) {
      const file = event.target.files[0];
      if (!file) return;

      if (!file.name.toLowerCase().endsWith(".gpx")) {
        this.$store.app.showAlert("Please select a valid GPX file.", "error");
        return;
      }

      try {
        this.$store.app.setLoading(true);
        const fileContent = await file.text();
        const { points, elevations, timestamps, heartRates, metadata } =
          GPXParser.parse(fileContent);

        if (points.length === 0) {
          this.$store.app.showAlert(
            "No track points found in the GPX file.",
            "error"
          );
          return;
        }

        // Clear existing route
        this.$store.route.clearRoute();

        // Load new route data
        this.$store.route.loadFromGPX(
          points,
          elevations,
          timestamps,
          heartRates
        );

        // Update activity data with imported metadata (use setTimeout to break potential circular references)
        setTimeout(() => {
          this.$store.activity.updateFromGPX(metadata);

          // Try to detect activity type from filename
          this.detectActivityType(file.name);

          // Center map on the route
          if (points.length > 0) {
            const bounds = L.latLngBounds(points);
            this.$store.route.map.fitBounds(bounds);
          }

          // Redraw route and update stats
          this.$dispatch("redraw-route");
          this.$dispatch("stats-update");
        }, 0);

        // Generate success message with data quality warnings
        let successMessage =
          `Successfully imported ${points.length} track points with metadata:\n` +
          `Name: ${metadata.name || "N/A"}\n` +
          `Duration: ${
            metadata.duration
              ? Math.round(metadata.duration / 60) + " minutes"
              : "N/A"
          }\n` +
          `Distance: ${
            metadata.distance ? metadata.distance.toFixed(2) + " km" : "N/A"
          }\n` +
          `Avg HR: ${metadata.avgHeartRate || "N/A"} bpm`;

        // Add data quality warnings
        if (metadata.dataQuality) {
          const quality = metadata.dataQuality;

          if (quality.timingAccuracy === "low") {
            successMessage += `\n\n⚠️ WARNING: Limited timing data (${quality.pointCount} points)`;
            successMessage += `\nPace variability calculations may be inaccurate.`;
            successMessage += `\nRecommended: Use GPS files with more detailed tracking.`;
          } else if (quality.timingAccuracy === "medium") {
            successMessage += `\n\n⚠️ NOTE: Moderate timing data (${quality.pointCount} points)`;
            successMessage += `\nVariability calculations are estimates.`;
          }

          if (!quality.hasHeartRateData) {
            successMessage += `\n\n💡 INFO: No heart rate data found.`;
            successMessage += `\nUsing default heart rate variability settings.`;
          } else if (heartRates.filter((hr) => hr && hr > 0).length < 10) {
            successMessage += `\n\n⚠️ WARNING: Limited heart rate data.`;
            successMessage += `\nHR variability calculations may be inaccurate.`;
          }
        }

        this.$store.app.showAlert(successMessage, "success");

        // Clear file input
        event.target.value = "";
      } catch (error) {
        console.error("GPX import failed:", error);
        this.$store.app.showAlert(
          "Failed to import GPX file. Please check if the file is valid.",
          "error"
        );
      } finally {
        this.$store.app.setLoading(false);
      }
    },

    detectActivityType(fileName) {
      const name = fileName.toLowerCase();
      if (name.includes("run") || name.includes("jog")) {
        this.$store.activity.updateActivityType("running");
      } else if (name.includes("walk")) {
        this.$store.activity.updateActivityType("walking");
      } else if (name.includes("bike") || name.includes("cycle")) {
        this.$store.activity.updateActivityType("cycling");
      } else if (name.includes("hike")) {
        this.$store.activity.updateActivityType("hiking");
      }
    },

    generateGPX() {
      const points = this.$store.route.points;
      const elevationData = this.$store.route.elevationData;
      const activity = this.$store.activity;

      if (points.length < 2) {
        this.$store.app.showAlert(
          "Please draw a route with at least two points.",
          "error"
        );
        return;
      }

      // Validate minimum distance for Strava compatibility
      const totalDistance = this.$store.route.getDistance() * 1000; // meters
      if (totalDistance < 100) {
        this.$store.app.showAlert(
          "Route terlalu pendek. Minimal 100 meter untuk kompatibilitas Strava.",
          "error"
        );
        return;
      }

      try {
        this.$store.app.setLoading(true);

        // Prepare activity data for GPX generation
        const activityData = {
          name: activity.name,
          description: activity.description,
          date: activity.date,
          startTime: activity.startTime,
          activityType: activity.activityType,
          activityConfigs: activity.activityConfigs,
          avgHeartRate: activity.avgHeartRate,
          hrVariability: activity.hrVariability,
          paceInconsistency: activity.paceInconsistency,
        };

        // Calculate pace in seconds per km for GPX generation
        if (activity.activityType === "cycling") {
          const speed = activity.paceMin; // Speed in km/h or mph
          const speedKmh = activity.units === "km" ? speed : speed * 1.60934;
          activityData.avgPaceSecondsPerKm = 3600 / speedKmh;
        } else {
          const inputSeconds = activity.paceMin * 60 + activity.paceSec;
          activityData.avgPaceSecondsPerKm =
            activity.paceFormat === "min/km"
              ? inputSeconds
              : inputSeconds / 0.621371;
        }

        const gpxContent = GPXParser.generate(
          points,
          elevationData,
          activityData
        );

        // Download the GPX file
        const blob = new Blob([gpxContent], { type: "application/gpx+xml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${activity.name.replace(/ /g, "_")}_${
          activity.activityType
        }.gpx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        const duration = Math.round(
          ((totalDistance / 1000) * activityData.avgPaceSecondsPerKm) / 60
        );
        this.$store.app.showAlert(
          `GPX file berhasil digenerate dengan ${points.length} titik dan durasi ${duration} menit!`,
          "success"
        );

        console.log(`GPX generated with ${points.length} points`);
        console.log(`Total activity duration: ${duration} minutes`);
      } catch (error) {
        console.error("GPX generation failed:", error);
        this.$store.app.showAlert(
          error.message || "Failed to generate GPX file.",
          "error"
        );
      } finally {
        this.$store.app.setLoading(false);
      }
    },
  };
}
