import { LocationDropdowns } from "./location-dropdowns.js";

export class APIServices {
  static async fetchElevationData(locations) {
    try {
      const response = await fetch(
        "https://api.open-elevation.com/api/v1/lookup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            locations: locations.map((point) => ({
              latitude: point[0],
              longitude: point[1],
            })),
          }),
        }
      );
      const data = await response.json();
      return data.results.map((result) => result.elevation);
    } catch (error) {
      console.warn("Elevation API failed, using estimated elevation:", error);
      // Fallback: generate realistic elevation variations
      return locations.map(() => Math.floor(Math.random() * 100) + 10);
    }
  }

  static async snapRouteToRoads(routePoints, activityType) {
    if (routePoints.length < 2) {
      throw new Error(
        "Please draw a route with at least 2 points before aligning to roads."
      );
    }

    try {
      console.log("Snapping individual points to nearest roads...");

      // PERBAIKAN: Snap setiap titik secara individual ke jalan terdekat
      // Tidak menggunakan routing sama sekali!
      const snappedPoints = [];

      for (let i = 0; i < routePoints.length; i++) {
        const point = routePoints[i];
        const coordinate = `${point[1]},${point[0]}`;

        try {
          // Gunakan nearest API untuk snap titik individual
          const nearestResponse = await fetch(
            `https://router.project-osrm.org/nearest/v1/foot/${coordinate}?number=1`
          );

          if (nearestResponse.ok) {
            const nearestData = await nearestResponse.json();

            if (nearestData.waypoints && nearestData.waypoints.length > 0) {
              const snappedCoord = nearestData.waypoints[0].location;
              const snappedPoint = [snappedCoord[1], snappedCoord[0]]; // [lat, lng]

              // Cek jarak antara original dan snapped point
              const distance = this.calculateDistance(point, snappedPoint);

              // Hanya snap jika jaraknya masuk akal (< 100 meter)
              if (distance < 0.1) {
                // 100 meters in km
                snappedPoints.push(snappedPoint);
                console.log(
                  `Point ${i} snapped ${(distance * 1000).toFixed(0)}m to road`
                );
              } else {
                // Jika terlalu jauh, keep original point
                snappedPoints.push(point);
                console.log(
                  `Point ${i} kept original (road too far: ${(
                    distance * 1000
                  ).toFixed(0)}m)`
                );
              }
            } else {
              // API gagal, keep original point
              snappedPoints.push(point);
              console.log(`Point ${i} kept original (no nearby road found)`);
            }
          } else {
            // API gagal, keep original point
            snappedPoints.push(point);
            console.log(`Point ${i} kept original (API error)`);
          }
        } catch (pointError) {
          // Error untuk titik ini, keep original
          snappedPoints.push(point);
          console.log(
            `Point ${i} kept original (error: ${pointError.message})`
          );
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      console.log(`Snapped ${snappedPoints.length} points individually`);
      return snappedPoints;
    } catch (error) {
      console.error("Point snapping failed:", error);
      throw new Error(
        "Failed to align points to roads. Please check your internet connection or try again."
      );
    }
  }

  static calculateDistance(point1, point2) {
    const R = 6371; // Earth's radius in km
    const dLat = ((point2[0] - point1[0]) * Math.PI) / 180;
    const dLon = ((point2[1] - point1[1]) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((point1[0] * Math.PI) / 180) *
        Math.cos((point2[0] * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  static async searchLocation(query) {
    if (query.length < 2) {
      return [];
    }

    // PRIORITAS: Gunakan sistem offline hierarchy terlebih dahulu
    try {
      console.log("Searching in offline database first...");
      const offlineResults = LocationDropdowns.searchInHierarchy(query);

      if (offlineResults.length > 0) {
        console.log(
          `Found ${offlineResults.length} results in offline database`
        );
        return offlineResults;
      }
    } catch (error) {
      console.warn("Offline search failed:", error);
    }

    // BACKUP: Coba online services jika offline tidak ada hasil
    try {
      console.log("Trying online search as backup...");

      // Try nominatim with timeout and error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      try {
        const results = await this.searchNominatimDirect(
          query,
          controller.signal
        );
        clearTimeout(timeoutId);

        if (results && results.length > 0) {
          console.log(`Found ${results.length} results from Nominatim`);
          return results.slice(0, 8);
        }
      } catch (nominatimError) {
        clearTimeout(timeoutId);
        console.warn("Nominatim search failed:", nominatimError.message);
      }

      // Final fallback to curated list
      console.log("Using curated fallback locations...");
      return this.getFallbackLocations(query);
    } catch (error) {
      console.error("All search methods failed:", error);
      // Return empty array to prevent UI errors
      return [];
    }
  }

  static async searchNominatimDirect(query, signal) {
    // Add Indonesia bias and language preference
    const params = new URLSearchParams({
      format: "json",
      q: `${query}, Indonesia`, // Always add Indonesia to narrow search
      "accept-language": "id,en", // Prefer Indonesian, fallback to English
      countrycodes: "ID", // Limit to Indonesia
      limit: "8",
      addressdetails: "1",
      extratags: "1",
      namedetails: "1",
    });

    const nominatimUrl = `https://nominatim.openstreetmap.org/search?${params}`;

    // Try direct request with abort signal
    const response = await fetch(nominatimUrl, {
      signal,
      headers: {
        "User-Agent": "StravaMapGenerator/1.0",
        Referer: window.location.origin,
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim request failed: ${response.status}`);
    }

    const data = await response.json();
    return data;
  }

  static async searchAlternativeService(query) {
    // Use OpenCage or similar service as backup
    // For now, return empty to fall back to our curated list
    throw new Error("Alternative service not implemented");
  }

  static getFallbackLocations(query) {
    // Comprehensive Indonesian locations for fallback with hierarchical support
    const locations = [
      // Kalimantan Selatan
      {
        place_id: "1",
        display_name: "Banjarmasin, Kalimantan Selatan, Indonesia",
        lat: "-3.3194",
        lon: "114.5906",
        type: "city",
      },
      {
        place_id: "2",
        display_name: "Barito Kuala, Kalimantan Selatan, Indonesia",
        lat: "-3.2614",
        lon: "114.6405",
        type: "regency",
      },
      {
        place_id: "3",
        display_name: "Banjarbaru, Kalimantan Selatan, Indonesia",
        lat: "-3.4441",
        lon: "114.8405",
        type: "city",
      },
      {
        place_id: "4",
        display_name: "Martapura, Kalimantan Selatan, Indonesia",
        lat: "-3.4167",
        lon: "114.8500",
        type: "city",
      },
      {
        place_id: "5",
        display_name: "Kalimantan Selatan, Indonesia",
        lat: "-2.5489",
        lon: "115.1414",
        type: "province",
      },

      // Major Indonesian Cities
      {
        place_id: "10",
        display_name: "Jakarta, DKI Jakarta, Indonesia",
        lat: "-6.2088",
        lon: "106.8456",
        type: "city",
      },
      {
        place_id: "11",
        display_name: "Surabaya, Jawa Timur, Indonesia",
        lat: "-7.2575",
        lon: "112.7521",
        type: "city",
      },
      {
        place_id: "12",
        display_name: "Medan, Sumatera Utara, Indonesia",
        lat: "3.5952",
        lon: "98.6722",
        type: "city",
      },
      {
        place_id: "13",
        display_name: "Bandung, Jawa Barat, Indonesia",
        lat: "-6.9175",
        lon: "107.6191",
        type: "city",
      },
      {
        place_id: "14",
        display_name: "Makassar, Sulawesi Selatan, Indonesia",
        lat: "-5.1477",
        lon: "119.4327",
        type: "city",
      },
      {
        place_id: "15",
        display_name: "Semarang, Jawa Tengah, Indonesia",
        lat: "-6.9667",
        lon: "110.4167",
        type: "city",
      },
      {
        place_id: "16",
        display_name: "Palembang, Sumatera Selatan, Indonesia",
        lat: "-2.9761",
        lon: "104.7754",
        type: "city",
      },
      {
        place_id: "17",
        display_name: "Denpasar, Bali, Indonesia",
        lat: "-8.6500",
        lon: "115.2167",
        type: "city",
      },
      {
        place_id: "18",
        display_name: "Yogyakarta, DI Yogyakarta, Indonesia",
        lat: "-7.7956",
        lon: "110.3695",
        type: "city",
      },

      // Provinces for hierarchical search
      {
        place_id: "20",
        display_name: "Jawa Barat, Indonesia",
        lat: "-6.9167",
        lon: "107.6167",
        type: "province",
      },
      {
        place_id: "21",
        display_name: "Jawa Tengah, Indonesia",
        lat: "-7.1500",
        lon: "110.1167",
        type: "province",
      },
      {
        place_id: "22",
        display_name: "Jawa Timur, Indonesia",
        lat: "-7.5000",
        lon: "112.5000",
        type: "province",
      },
      {
        place_id: "23",
        display_name: "Sumatera Utara, Indonesia",
        lat: "3.0000",
        lon: "99.0000",
        type: "province",
      },
      {
        place_id: "24",
        display_name: "Sumatera Selatan, Indonesia",
        lat: "-3.0000",
        lon: "104.0000",
        type: "province",
      },
      {
        place_id: "25",
        display_name: "Bali, Indonesia",
        lat: "-8.3333",
        lon: "115.0833",
        type: "province",
      },

      // Country level
      {
        place_id: "30",
        display_name: "Indonesia",
        lat: "-2.5489",
        lon: "118.0149",
        type: "country",
      },
    ];

    const lowerQuery = query.toLowerCase().trim();

    // Enhanced search logic with better matching
    const matchedLocations = locations.filter((loc) => {
      const displayName = loc.display_name.toLowerCase();
      const parts = displayName.split(",").map((part) => part.trim());

      // Exact match in any part
      if (parts.some((part) => part === lowerQuery)) {
        return true;
      }

      // Starts with match
      if (parts.some((part) => part.startsWith(lowerQuery))) {
        return true;
      }

      // Contains match
      if (displayName.includes(lowerQuery)) {
        return true;
      }

      return false;
    });

    // Sort by relevance: exact matches first, then by type priority
    const typeOrder = { city: 1, regency: 2, province: 3, country: 4 };

    return matchedLocations
      .sort((a, b) => {
        const aExact =
          a.display_name.toLowerCase().split(",")[0].trim() === lowerQuery;
        const bExact =
          b.display_name.toLowerCase().split(",")[0].trim() === lowerQuery;

        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        return (typeOrder[a.type] || 5) - (typeOrder[b.type] || 5);
      })
      .slice(0, 8); // Return more results for better UX
  }
}
