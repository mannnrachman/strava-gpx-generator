import { WorldwideLocationData } from "./worldwide-location-data.js";

export class LocationDropdowns {
  static getCountries() {
    return WorldwideLocationData.getCountries();
  }

  static getStatesByCountry(countryCode) {
    return WorldwideLocationData.getStatesByCountry(countryCode);
  }

  static getCitiesByState(countryCode, stateCode) {
    return WorldwideLocationData.getCitiesByState(countryCode, stateCode);
  }

  // Legacy methods for backward compatibility
  static getProvinces() {
    return this.getStatesByCountry("ID");
  }

  static getCitiesByProvince(provinceCode) {
    return this.getCitiesByState("ID", provinceCode);
  }

  // New methods for cascading dropdowns
  static getCountryDropdownOptions() {
    return this.getCountries().map((country) => ({
      value: country.code,
      text: country.name,
      center: country.center,
    }));
  }

  static getStateDropdownOptions(countryCode) {
    const states = this.getStatesByCountry(countryCode);
    return states.map((state) => ({
      value: state.code,
      text: state.name,
      center: state.center,
    }));
  }

  static getCityDropdownOptions(countryCode, stateCode) {
    const cities = this.getCitiesByState(countryCode, stateCode);
    return cities.map((city) => ({
      value: city.name.replace(/\s+/g, "_").toLowerCase(),
      text: city.name,
      center: city.center,
    }));
  }

  // Enhanced search for new structure
  static searchInHierarchy(query) {
    if (!query || query.length < 2) return [];

    const results = [];
    const lowerQuery = query.toLowerCase().trim();

    // Search countries
    const countries = this.getCountries();
    countries.forEach((country) => {
      if (country.name.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: "country",
          name: country.name,
          display_name: country.name,
          lat: country.center[0].toString(),
          lon: country.center[1].toString(),
          place_id: `country_${country.code}`,
        });
      }
    });

    // Search states/provinces for all countries
    countries.forEach((country) => {
      const states = this.getStatesByCountry(country.code);
      states.forEach((state) => {
        if (state.name.toLowerCase().includes(lowerQuery)) {
          results.push({
            type: "state",
            name: state.name,
            display_name: `${state.name}, ${country.name}`,
            lat: state.center[0].toString(),
            lon: state.center[1].toString(),
            place_id: `state_${country.code}_${state.code}`,
          });
        }
      });

      // Search cities
      states.forEach((state) => {
        const cities = this.getCitiesByState(country.code, state.code);
        cities.forEach((city) => {
          if (city.name.toLowerCase().includes(lowerQuery)) {
            results.push({
              type: "city",
              name: city.name,
              display_name: `${city.name}, ${state.name}, ${country.name}`,
              lat: city.center[0].toString(),
              lon: city.center[1].toString(),
              place_id: `city_${country.code}_${state.code}_${city.name.replace(
                /\s+/g,
                "_"
              )}`,
            });
          }
        });
      });
    });

    // Sort by relevance: exact matches first, then by type priority
    const typeOrder = { city: 1, state: 2, country: 3 };

    return results
      .sort((a, b) => {
        const aExact = a.name.toLowerCase() === lowerQuery;
        const bExact = b.name.toLowerCase() === lowerQuery;

        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        return (typeOrder[a.type] || 4) - (typeOrder[b.type] || 4);
      })
      .slice(0, 15);
  }

  // Legacy methods for backward compatibility with existing functionality
  static getProvinceDropdownOptions() {
    return this.getStateDropdownOptions("ID");
  }
}
