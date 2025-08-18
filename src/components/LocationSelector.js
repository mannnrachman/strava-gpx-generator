import { LocationDropdowns } from "../utils/location-dropdowns.js";

export function LocationSelector() {
  return {
    selectedCountry: "",
    selectedState: "",
    selectedCity: "",
    countries: [],
    states: [],
    cities: [],

    init() {
      // Load countries on init
      this.countries = LocationDropdowns.getCountryDropdownOptions();

      // Initialize Select2 for all dropdowns after DOM is ready with delay
      this.$nextTick(() => {
        // Add delay to ensure jQuery and Select2 are fully loaded
        setTimeout(() => {
          this.initializeSelect2();
        }, 500);
      });
    },

    initializeSelect2() {
      // Initialize Country Select2
      if (typeof window !== "undefined" && window.$ && window.$.fn.select2) {
        const countrySelect = window.$("#countrySelect");
        if (countrySelect.length) {
          countrySelect.select2({
            placeholder: "Select Country",
            allowClear: true,
            data: [
              { id: "", text: "Select Country" },
              ...this.countries.map((country) => ({
                id: country.value,
                text: country.text,
              })),
            ],
          });

          // Handle country change
          countrySelect.on("change", (e) => {
            this.onCountryChange(e.target.value);
          });
        }

        // Initialize State Select2
        const stateSelect = window.$("#stateSelect");
        if (stateSelect.length) {
          stateSelect.select2({
            placeholder: "Select Province/State",
            allowClear: true,
            data: [{ id: "", text: "Select Province/State" }],
          });

          // Handle state change
          stateSelect.on("change", (e) => {
            this.onStateChange(e.target.value);
          });
        }

        // Initialize City Select2
        const citySelect = window.$("#citySelect");
        if (citySelect.length) {
          citySelect.select2({
            placeholder: "Select City",
            allowClear: true,
            data: [{ id: "", text: "Select City" }],
          });

          // Handle city change
          citySelect.on("change", (e) => {
            this.onCityChange(e.target.value);
          });
        }
      }
    },

    onCountryChange(countryCode) {
      this.selectedCountry = countryCode;
      this.selectedState = "";
      this.selectedCity = "";

      if (countryCode) {
        // Load states for selected country
        this.states = LocationDropdowns.getStateDropdownOptions(countryCode);

        // Update state dropdown
        if (window.$) {
          const stateSelect = window.$("#stateSelect");
          stateSelect.empty();
          stateSelect.select2({
            placeholder: "Select Province/State",
            allowClear: true,
            data: [
              { id: "", text: "Select Province/State" },
              ...this.states.map((state) => ({
                id: state.value,
                text: state.text,
              })),
            ],
          });
        }
      } else {
        this.states = [];
      }

      // Clear cities
      this.cities = [];
      this.updateCityDropdown();
    },

    onStateChange(stateCode) {
      this.selectedState = stateCode;
      this.selectedCity = "";

      if (stateCode && this.selectedCountry) {
        // Load cities for selected state
        this.cities = LocationDropdowns.getCityDropdownOptions(
          this.selectedCountry,
          stateCode
        );
        this.updateCityDropdown();
      } else {
        this.cities = [];
        this.updateCityDropdown();
      }
    },

    onCityChange(cityValue) {
      this.selectedCity = cityValue;

      if (cityValue && this.selectedState && this.selectedCountry) {
        // Find the selected city and trigger location change
        const selectedCity = this.cities.find(
          (city) => city.value === cityValue
        );
        if (selectedCity) {
          this.selectLocation({
            type: "city",
            name: selectedCity.text,
            center: selectedCity.center,
            country: this.getCountryName(),
            state: this.getStateName(),
          });
        }
      }
    },

    updateCityDropdown() {
      if (window.$) {
        const citySelect = window.$("#citySelect");
        citySelect.empty();
        citySelect.select2({
          placeholder: "Select City",
          allowClear: true,
          data: [
            { id: "", text: "Select City" },
            ...this.cities.map((city) => ({
              id: city.value,
              text: city.text,
            })),
          ],
        });
      }
    },

    selectLocation(location) {
      // Dispatch custom event for other components (MapComponent will handle the map centering)
      this.$dispatch("location-selected", {
        location: location,
        country: this.selectedCountry,
        state: this.selectedState,
        city: this.selectedCity,
      });
    },

    getCountryName() {
      const country = this.countries.find(
        (c) => c.value === this.selectedCountry
      );
      return country ? country.text : "";
    },

    getStateName() {
      const state = this.states.find((s) => s.value === this.selectedState);
      return state ? state.text : "";
    },

    getCityName() {
      const city = this.cities.find((c) => c.value === this.selectedCity);
      return city ? city.text : "";
    },

    // Method to programmatically set location (for backward compatibility)
    setLocation(country, state, city) {
      if (country) {
        this.selectedCountry = country;
        this.onCountryChange(country);

        if (state) {
          setTimeout(() => {
            this.selectedState = state;
            this.onStateChange(state);

            if (city) {
              setTimeout(() => {
                this.selectedCity = city;
                this.onCityChange(city);
              }, 100);
            }
          }, 100);
        }
      }
    },

    // Reset all selections
    reset() {
      this.selectedCountry = "";
      this.selectedState = "";
      this.selectedCity = "";
      this.states = [];
      this.cities = [];

      if (window.$) {
        window.$("#countrySelect").val("").trigger("change");
        window
          .$("#stateSelect")
          .empty()
          .select2({
            placeholder: "Select Province/State",
            data: [{ id: "", text: "Select Province/State" }],
          });
        window
          .$("#citySelect")
          .empty()
          .select2({
            placeholder: "Select City",
            data: [{ id: "", text: "Select City" }],
          });
      }
    },
  };
}
