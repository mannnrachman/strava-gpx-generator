export class GPXParser {
  static parse(gpxContent) {
    const parser = new DOMParser();
    const gpxDoc = parser.parseFromString(gpxContent, "text/xml");

    // Extract track points
    const trackPoints = gpxDoc.querySelectorAll("trkpt");
    const points = [];
    const elevations = [];
    const timestamps = [];
    const heartRates = [];

    trackPoints.forEach((trkpt) => {
      const lat = parseFloat(trkpt.getAttribute("lat"));
      const lon = parseFloat(trkpt.getAttribute("lon"));

      // Extract elevation
      const eleElement = trkpt.querySelector("ele");
      const elevation = eleElement ? parseFloat(eleElement.textContent) : 10;

      // Extract timestamp
      const timeElement = trkpt.querySelector("time");
      const timestamp = timeElement ? timeElement.textContent : null;

      // Extract heart rate (try multiple selectors for compatibility)
      let hrElement = trkpt.querySelector("gpxtpx\\:hr");
      if (!hrElement) hrElement = trkpt.querySelector("hr");
      if (!hrElement)
        hrElement = trkpt.querySelector(
          "extensions gpxtpx\\:TrackPointExtension gpxtpx\\:hr"
        );
      const heartRate = hrElement ? parseInt(hrElement.textContent) : null;

      points.push([lat, lon]);
      elevations.push(elevation);
      timestamps.push(timestamp);
      heartRates.push(heartRate);
    });

    // Extract metadata
    const metadata = this.extractMetadata(
      gpxDoc,
      points,
      timestamps,
      heartRates
    );

    console.log("Parsed GPX metadata:", metadata);

    return { points, elevations, timestamps, heartRates, metadata };
  }

  static extractMetadata(gpxDoc, points, timestamps, heartRates) {
    const metadata = {};

    // Calculate valid heart rates once at the beginning
    const validHeartRates = heartRates.filter((hr) => hr && hr > 0);

    // Try different ways to get track name
    let nameElement = gpxDoc.querySelector("trk > name");
    if (!nameElement) nameElement = gpxDoc.querySelector("metadata > name");
    metadata.name = nameElement ? nameElement.textContent : "Imported Activity";

    // Try to get description
    let descElement = gpxDoc.querySelector("metadata > desc");
    if (!descElement) descElement = gpxDoc.querySelector("trk > desc");
    metadata.description = descElement
      ? descElement.textContent
      : "Imported from GPX file";

    // Try to get start time from various sources
    let timeElement = gpxDoc.querySelector("metadata > time");
    if (!timeElement) timeElement = gpxDoc.querySelector("metadate"); // Samsung typo
    if (!timeElement && timestamps[0]) {
      metadata.startTime = new Date(timestamps[0]);
    } else if (timeElement) {
      metadata.startTime = new Date(timeElement.textContent);
    } else {
      metadata.startTime = new Date();
    }

    // Calculate pace and other stats from timestamps and points
    if (
      timestamps.length > 1 &&
      timestamps[0] &&
      timestamps[timestamps.length - 1]
    ) {
      const startTime = new Date(timestamps[0]);
      const endTime = new Date(timestamps[timestamps.length - 1]);
      const durationSeconds = (endTime - startTime) / 1000;

      // Calculate total distance
      let totalDistance = 0;
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = L.latLng(points[i][0], points[i][1]);
        const p2 = L.latLng(points[i + 1][0], points[i + 1][1]);
        totalDistance += p1.distanceTo(p2); // meters
      }

      const distanceKm = totalDistance / 1000;
      const paceSecondsPerKm = durationSeconds / distanceKm;
      const paceMinutes = Math.floor(paceSecondsPerKm / 60);
      const paceSeconds = Math.round(paceSecondsPerKm % 60);

      metadata.pace = { minutes: paceMinutes, seconds: paceSeconds };
      metadata.distance = distanceKm;
      metadata.duration = durationSeconds;

      // Add data quality indicator
      metadata.dataQuality = {
        pointCount: points.length,
        hasDetailedTiming: points.length > 100,
        hasHeartRateData: validHeartRates.length > 0,
        timingAccuracy:
          points.length > 100 ? "high" : points.length > 20 ? "medium" : "low",
      };
    }

    // Calculate average heart rate and variability
    if (validHeartRates.length > 0) {
      metadata.avgHeartRate = Math.round(
        validHeartRates.reduce((sum, hr) => sum + hr, 0) /
          validHeartRates.length
      );

      // Calculate HR variability with fallback for low data points
      if (validHeartRates.length >= 10) {
        const hrVariance =
          validHeartRates.reduce((sum, hr) => {
            return sum + Math.pow(hr - metadata.avgHeartRate, 2);
          }, 0) / validHeartRates.length;
        const hrStdDev = Math.sqrt(hrVariance);
        const hrVariabilityPercent = hrStdDev / metadata.avgHeartRate;

        // Map to slider values (0-2): [2%, 5%, 10%]
        if (hrVariabilityPercent <= 0.03) metadata.hrVariability = 0;
        else if (hrVariabilityPercent <= 0.075) metadata.hrVariability = 1;
        else metadata.hrVariability = 2;
      } else {
        // Fallback: Use default moderate variability for limited data
        metadata.hrVariability = 1; // Default to 5% variability
        console.warn(
          `Limited HR data (${validHeartRates.length} points). Using default variability.`
        );
      }
    }

    // Calculate pace variability if we have time data
    if (metadata.pace && timestamps.length > 5) {
      const paceValues = [];
      for (let i = 1; i < points.length; i++) {
        if (timestamps[i] && timestamps[i - 1]) {
          const timeDiff =
            (new Date(timestamps[i]) - new Date(timestamps[i - 1])) / 1000;
          const p1 = L.latLng(points[i - 1][0], points[i - 1][1]);
          const p2 = L.latLng(points[i][0], points[i][1]);
          const distance = p1.distanceTo(p2) / 1000; // km

          if (distance > 0.001) {
            // minimum 1m segment
            const segmentPace = timeDiff / distance; // seconds per km
            paceValues.push(segmentPace);
          }
        }
      }

      if (paceValues.length >= 10) {
        // Sufficient data for accurate calculation
        const avgPace =
          paceValues.reduce((sum, p) => sum + p, 0) / paceValues.length;
        const paceVariance =
          paceValues.reduce((sum, p) => {
            return sum + Math.pow(p - avgPace, 2);
          }, 0) / paceValues.length;
        const paceStdDev = Math.sqrt(paceVariance);
        const paceVariabilityPercent = paceStdDev / avgPace;

        // Map to slider values (0-3): [5%, 15%, 30%, 50%]
        if (paceVariabilityPercent <= 0.1) metadata.paceInconsistency = 0;
        else if (paceVariabilityPercent <= 0.225)
          metadata.paceInconsistency = 1;
        else if (paceVariabilityPercent <= 0.4) metadata.paceInconsistency = 2;
        else metadata.paceInconsistency = 3;
      } else if (paceValues.length > 0) {
        // Limited data: use conservative estimate
        metadata.paceInconsistency = 1; // Default to moderate inconsistency
        console.warn(
          `Limited pace data (${paceValues.length} segments). Using default inconsistency.`
        );
      } else {
        // No valid pace segments: use minimal inconsistency
        metadata.paceInconsistency = 0;
        console.warn(
          "No valid pace segments found. Using minimal inconsistency."
        );
      }
    } else {
      // No timing data or very few points: use default values
      metadata.paceInconsistency = 0; // Assume consistent for limited data
      console.warn(
        "Insufficient timing data for pace variability calculation."
      );
    }

    return metadata;
  }

  static generate(routePoints, elevationData, activityData) {
    const { name, description, date, startTime, activityType } = activityData;
    const startDateTime = new Date(`${date}T${startTime}`);

    if (isNaN(startDateTime.getTime())) {
      throw new Error("Invalid date or time");
    }

    let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1" version="1.1" creator="StravaGPXGenerator" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd http://www.garmin.com/xmlschemas/TrackPointExtension/v1 http://www.garmin.com/xmlschemas/TrackPointExtensionv1.xsd">
<metadate>${startDateTime.toISOString()}</metadate>
<trk>
<name>${name}</name>
<trkseg>`;

    // Generate track points with realistic timing and heart rate
    let cumulativeTime = 0;
    const config = activityData.activityConfigs[activityType];

    for (let i = 0; i < routePoints.length; i++) {
      const lat = routePoints[i][0];
      const lon = routePoints[i][1];

      if (i > 0) {
        const p1 = L.latLng(routePoints[i - 1][0], routePoints[i - 1][1]);
        const p2 = L.latLng(routePoints[i][0], routePoints[i][1]);
        const segmentDistance = p1.distanceTo(p2); // meters

        const timeVariation = 1 + Math.random(); // 1-2 seconds
        const calculatedTime =
          (segmentDistance / 1000) * activityData.avgPaceSecondsPerKm;
        const timeForSegment = Math.max(timeVariation, calculatedTime);

        cumulativeTime += timeForSegment;
      }

      const currentTimestamp = new Date(
        startDateTime.getTime() + cumulativeTime * 1000
      );
      const elevation = elevationData[i] || 10; // Default to 10m if no elevation data

      // Generate heart rate with variability
      const hrNoise =
        (Math.random() - 0.5) * 2 * (activityData.hrVariability * 0.05);
      const currentHr = Math.max(
        config.hrRange.min,
        Math.min(
          config.hrRange.max,
          Math.round(activityData.avgHeartRate * (1 + hrNoise))
        )
      );

      const formattedLat = parseFloat(lat).toFixed(7);
      const formattedLon = parseFloat(lon).toFixed(7);
      const formattedElevation = Math.round(elevation * 1000) / 1000;

      gpx += `
<trkpt lat="${formattedLat}" lon="${formattedLon}">
<ele>${formattedElevation}</ele>
<time>${currentTimestamp.toISOString()}</time>
<extensions>
<gpxtpx:TrackPointExtension>
<gpxtpx:hr>${currentHr}</gpxtpx:hr>
</gpxtpx:TrackPointExtension>
</extensions>
</trkpt>`;
    }

    gpx += `
</trkseg>
</trk>
</gpx>`;

    return gpx;
  }
}
