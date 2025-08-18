export class Calculations {
  static calculateDistance(points, units = "km") {
    if (points.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = L.latLng(points[i][0], points[i][1]);
      const p2 = L.latLng(points[i + 1][0], points[i + 1][1]);
      totalDistance += p1.distanceTo(p2); // meters
    }

    const km = totalDistance / 1000;
    return units === "km" ? km : km * 0.621371; // miles
  }

  static calculateElevationGain(elevationData) {
    if (elevationData.length < 2) return 0;

    let totalGain = 0;
    for (let i = 1; i < elevationData.length; i++) {
      const elevationDiff = elevationData[i] - elevationData[i - 1];
      if (elevationDiff > 0) {
        totalGain += elevationDiff;
      }
    }
    return Math.round(totalGain);
  }

  static calculatePaceAndDuration(
    distance,
    activityType,
    paceMin,
    paceSec,
    units,
    paceFormat
  ) {
    let durationSeconds;
    let paceDisplay;

    if (activityType === "cycling") {
      // For cycling, use speed (km/h or mph)
      const speed = paceMin; // Speed value from input
      const speedKmh = units === "km" ? speed : speed * 1.60934; // Convert mph to km/h if needed
      const distanceKm = units === "km" ? distance : distance * 1.60934; // Convert miles to km if needed

      durationSeconds = (distanceKm / speedKmh) * 3600; // hours to seconds
      paceDisplay = `${speed} ${units === "km" ? "km/h" : "mph"}`;
    } else {
      // For running, walking, hiking - use pace (FIXED to match strava-generator.html)
      const inputSeconds = paceMin * 60 + paceSec; // shown values
      // Convert to seconds per km for calculations
      const secondsPerKm =
        paceFormat === "min/km" ? inputSeconds : inputSeconds / 0.621371;

      // Duration = distance (in current units) converted to km * secPerKm
      const distanceKm = units === "km" ? distance : distance / 0.621371;
      durationSeconds = distanceKm * secondsPerKm;
      paceDisplay = `${paceMin}:${paceSec
        .toString()
        .padStart(2, "0")} ${paceFormat}`;
    }

    const hours = Math.floor(durationSeconds / 3600);
    const minutes = Math.floor((durationSeconds % 3600) / 60);
    const seconds = Math.floor(durationSeconds % 60);
    const durationDisplay = `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

    return { paceDisplay, durationDisplay, durationSeconds };
  }

  static generateChartData(
    points,
    distance,
    activityType,
    paceMin,
    paceSec,
    avgHr,
    paceInconsistency,
    hrVariability,
    units,
    paceFormat
  ) {
    if (points.length < 2) return null;

    const activityConfigs = {
      running: { hrRange: { min: 120, max: 180 } },
      cycling: { hrRange: { min: 110, max: 170 } },
      walking: { hrRange: { min: 80, max: 140 } },
      hiking: { hrRange: { min: 90, max: 160 } },
    };

    const config = activityConfigs[activityType];
    let avgValue, valueLabel, valueFormatter;

    if (activityType === "cycling") {
      // For cycling, use speed
      avgValue = paceMin; // Speed in km/h or mph
      valueLabel = `Speed (${units === "km" ? "km/h" : "mph"})`;
      valueFormatter = (value) =>
        `${value.toFixed(1)} ${units === "km" ? "km/h" : "mph"}`;
    } else {
      // For running, walking, hiking - use pace (FIXED to match strava-generator.html)
      const avgPaceInputMin = paceMin + paceSec / 60;
      const avgPaceMinPerKm =
        paceFormat === "min/km" ? avgPaceInputMin : avgPaceInputMin / 0.621371;
      avgValue = avgPaceMinPerKm;
      valueLabel = `Pace (${paceFormat})`;
      valueFormatter = (value) => {
        const minutes = Math.floor(value);
        const seconds = Math.round((value - minutes) * 60);
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
      };
    }

    // Map slider positions to numeric variance
    const paceSteps =
      activityType === "cycling" ? [1, 3, 6, 10] : [0.05, 0.15, 0.3, 0.5];
    const hrSteps = [0.02, 0.05, 0.1];
    const paceInconsistencyValue =
      paceSteps[paceInconsistency] || (activityType === "cycling" ? 3 : 0.15);
    const hrVariabilityValue = hrSteps[hrVariability] || 0.05;

    const numPoints = Math.max(20, Math.floor(distance * 5)); // More points for longer distances
    const labels = Array.from({ length: numPoints }, (_, i) => {
      const unitLabel = units === "km" ? "km" : "mi";
      return ((distance / numPoints) * (i + 1)).toFixed(1) + ` ${unitLabel}`;
    });

    const paceData = Array.from({ length: numPoints }, () => {
      const noise = (Math.random() - 0.5) * 2; // -1 to 1
      let value;
      if (activityType === "cycling") {
        value = avgValue * (1 + noise * (paceInconsistencyValue / avgValue));
      } else {
        value = avgValue * (1 + noise * paceInconsistencyValue);
        // If displaying min/mi, convert
        if (paceFormat === "min/mi") {
          value = value * 1.60934;
        }
      }
      return Math.max(0, value);
    });

    const hrData = Array.from({ length: numPoints }, () => {
      const noise = (Math.random() - 0.5) * 2; // -1 to 1
      const value = avgHr * (1 + noise * hrVariabilityValue);
      return Math.max(
        config.hrRange.min,
        Math.min(config.hrRange.max, Math.round(value))
      );
    });

    // Clone data to prevent reactivity issues
    const result = {
      pace: {
        labels: [...labels],
        data: [...paceData],
        label: valueLabel,
        formatter: valueFormatter,
      },
      heartRate: {
        labels: [...labels],
        data: [...hrData],
        label: "Heart Rate (bpm)",
      },
    };

    console.log("Generated chart data:", {
      pacePoints: result.pace.data.length,
      hrPoints: result.heartRate.data.length,
      avgHr,
    });

    return result;
  }
}
