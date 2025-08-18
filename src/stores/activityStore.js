import Alpine from "alpinejs";

export const activityStore = Alpine.store("activity", {
  // Activity metadata
  name: "Afternoon Run",
  description: "A great run today!",
  date: new Date().toISOString().split("T")[0],
  startTime: new Date().toTimeString().split(" ")[0].substring(0, 5),

  // Activity settings
  activityType: "running",
  units: "km", // 'km' or 'mi'
  paceFormat: "min/km", // 'min/km' or 'min/mi'

  // Pace settings
  paceMin: 5,
  paceSec: 30,
  paceInconsistency: 1, // 0-3 slider value

  // Heart rate settings
  avgHeartRate: 150,
  hrVariability: 1, // 0-2 slider value

  // Calculated stats
  stats: {
    distance: 0,
    elevation: 0,
    pace: "0:00 min/km",
    duration: "00:00:00",
  },

  // Activity type configurations
  activityConfigs: {
    running: {
      paceType: "Pace",
      paceRange: { min: 3, max: 8 },
      hrRange: { min: 120, max: 180 },
      elevationFactor: 1.0,
      routingProfile: "foot",
    },
    cycling: {
      paceType: "Speed",
      paceRange: { min: 15, max: 45 },
      hrRange: { min: 110, max: 170 },
      elevationFactor: 0.8,
      routingProfile: "cycling",
    },
    walking: {
      paceType: "Pace",
      paceRange: { min: 8, max: 15 },
      hrRange: { min: 80, max: 140 },
      elevationFactor: 1.2,
      routingProfile: "foot",
    },
    hiking: {
      paceType: "Pace",
      paceRange: { min: 10, max: 20 },
      hrRange: { min: 90, max: 160 },
      elevationFactor: 1.5,
      routingProfile: "foot",
    },
  },

  // Methods
  updateActivityType(type) {
    this.activityType = type;
    const config = this.activityConfigs[type];

    // Update defaults based on activity type
    if (type === "cycling") {
      this.paceMin = 25;
      this.paceSec = 0;
    } else {
      const avgPace = Math.round(
        (config.paceRange.min + config.paceRange.max) / 2
      );
      this.paceMin = avgPace;
      this.paceSec = 30;
    }

    const avgHR = Math.round((config.hrRange.min + config.hrRange.max) / 2);
    this.avgHeartRate = avgHR;
  },

  updateUnits(units) {
    this.units = units;
    this.paceFormat = units === "km" ? "min/km" : "min/mi";
  },

  updateFromGPX(metadata) {
    if (metadata.name) this.name = metadata.name;
    if (metadata.description) this.description = metadata.description;
    if (metadata.startTime) {
      this.date = metadata.startTime.toISOString().split("T")[0];
      this.startTime = metadata.startTime
        .toTimeString()
        .split(" ")[0]
        .substring(0, 5);
    }
    if (metadata.pace) {
      this.paceMin = metadata.pace.minutes;
      this.paceSec = metadata.pace.seconds;
    }
    if (metadata.avgHeartRate) this.avgHeartRate = metadata.avgHeartRate;
    if (metadata.paceInconsistency !== undefined)
      this.paceInconsistency = metadata.paceInconsistency;
    if (metadata.hrVariability !== undefined)
      this.hrVariability = metadata.hrVariability;
  },
});
