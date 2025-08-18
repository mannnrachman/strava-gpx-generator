# 🏃‍♂️ Strava GPX Generator

Interactive GPX generator for creating realistic running activity files that can be uploaded to Strava. This application allows you to draw routes on an interactive map, set pace and heart rate parameters, and export GPX files with realistic training data.

## ✨ What is this?

Strava GPX Generator is a web-based tool that helps you create realistic GPX (GPS Exchange Format) files for running activities. Whether you want to plan a route, create training data, or generate activities for testing purposes, this tool provides an intuitive interface to:

- **Draw routes** interactively on a map
- **Set realistic pace and heart rate** with natural variability  
- **Generate elevation data** using real-world APIs
- **Export GPX files** compatible with Strava and other fitness platforms
- **Import existing GPX files** for editing and modification

The application is built with modern web technologies including Alpine.js, Leaflet maps, and Chart.js for real-time data visualization.

## ✨ Key Features

- 🗺️ **Interactive Map**: Draw routes by clicking on the map with location search
- 📊 **Real-time Statistics**: Automatic calculation of distance, pace, duration, and elevation
- 🎛️ **Customizable Settings**: Configure pace, heart rate, and natural variability
- 📈 **Live Charts**: Real-time preview of pace and heart rate profiles
- 🌓 **Dark/Light Theme**: Toggle between themes with preference storage
- 🔄 **Unit Support**: Kilometers/Miles with automatic conversion
- 📥 **GPX Import/Export**: Import existing GPX files for editing or export new ones
- ⚡ **Instant Export**: Download GPX files ready for Strava upload
- 🛣️ **Route Snapping**: Align routes to roads using routing APIs

## 🚀 Installation

### Option 1: Clone and Run Locally

```bash
# Clone the repository
git clone https://github.com/mannnrachman/strava-gpx-generator.git

# Navigate to project directory
cd strava-gpx-generator

# Install dependencies
npm install

# Start development server
npm run dev
```

Open your browser and go to `http://localhost:5173`

### Option 2: Run with Docker

#### Development Mode
```bash
# Clone and navigate to directory
git clone https://github.com/mannnrachman/strava-gpx-generator.git
cd strava-gpx-generator

# Run development server with Docker
docker-compose --profile dev up
```
Access at `http://localhost:5173`

#### Production Mode
```bash
# Build and run production version
docker-compose --profile prod up
```
Access at `http://localhost:80`

#### Quick Preview Mode
```bash
# Build and preview
docker-compose --profile preview up
```
Access at `http://localhost:4173`

### Option 3: Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 📖 How to Use

### Step 1: Set Your Location and Draw Route

1. **Search for a location** using the search box at the top
   - Type a city or place name (e.g., "Central Park New York", "Hyde Park London")
   - Select from the search results
   - The map will automatically move to that location

2. **Draw your route** by clicking on the map
   - Each click adds a route point connected by a red line
   - Click consecutively to create your desired route
   - Follow roads and paths for realistic routes

3. **Manage your route**
   - **Clear**: Remove all route points
   - **Align to Road**: Snap route to actual roads (optional)
   - **Import GPX**: Load an existing GPX file for editing

### Step 2: Configure Activity Settings

1. **Set units and format first** (this affects all calculations)
   - Choose **Kilometers** or **Miles**
   - Select **min/km** or **min/mi** pace format

2. **Enter activity details**
   - **Activity Name**: Name for your run (default: "Morning Run")
   - **Description**: Activity description
   - **Date**: Activity date (default: today)
   - **Start Time**: When the activity begins

3. **Configure pace settings**
   - **Pace**: Enter minutes and seconds per km/mile
     - Example for min/km: 5:30 = 5 minutes 30 seconds per kilometer
     - Example for min/mi: 8:00 = 8 minutes per mile
   - **Pace Variability**: Choose consistency level
     - **Steady**: Very consistent (±5%)
     - **Realistic**: Normal variation (±15%)
     - **Moderate**: Medium variation (±30%)
     - **High**: High variation (±50%)

4. **Set heart rate parameters**
   - **Average Heart Rate**: Target BPM (default: 150)
   - **Heart Rate Variability**: Natural variation level
     - **Minimal**: Small variation (±2%)
     - **Moderate**: Normal variation (±5%)
     - **High**: High variation (±10%)

### Step 3: Review Stats and Charts

1. **Real-time statistics** update as you draw:
   - **Distance**: Total distance in selected units
   - **Elevation Gain**: Real elevation data from Open-Elevation API
   - **Pace**: Average pace in selected format
   - **Duration**: Estimated total time

2. **Preview charts** show your activity profile:
   - **Pace Profile**: Pace variation along the route
   - **Heart Rate Profile**: Heart rate variation
   - Charts update in real-time and follow your theme

### Step 4: Export GPX File

1. **Ensure your route is complete**
   - At least 2 route points are required
   - All form fields should be filled

2. **Click "Generate Run File (.gpx)"**
   - The GPX file will be automatically downloaded
   - File contains GPS coordinates, timestamps, heart rate data, and elevation

3. **Upload to Strava**
   - Open Strava web or mobile app
   - Go to Upload Activity
   - Select your downloaded GPX file
   - Strava will process and display your activity

### Step 5: Additional Features

- **Dark/Light Theme**: Toggle using the theme button in the header
- **Import GPX**: Load existing GPX files to edit routes and settings
- **Activity Types**: Support for running, cycling, and walking activities
- **Route Snapping**: Automatically align routes to actual roads

## 🛠️ Technical Details

### Built With

- **Frontend Framework**: Alpine.js for reactive components
- **Styling**: Tailwind CSS with custom components
- **Maps**: Leaflet.js with OpenStreetMap tiles
- **Charts**: Chart.js with real-time data visualization
- **Build Tool**: Vite for fast development and building
- **APIs**: 
  - Open-Elevation API for real elevation data
  - OSRM API for route snapping
  - Nominatim API for location search

### Architecture

- **Modular Components**: Separated logic for map, forms, stats, and charts
- **Reactive State Management**: Alpine.js stores for activity, route, and app state
- **Real-time Updates**: Automatic recalculation of stats and chart updates
- **Responsive Design**: Mobile-first approach with touch-friendly controls

## 🎯 Tips for Best Results

1. **Draw realistic routes**: Follow actual roads and paths
2. **Use appropriate pace**: Set pace values that match your fitness level
3. **Choose natural variability**: Use "Realistic" or "Moderate" settings for natural-looking data
4. **Verify stats**: Check that distance and duration make sense
5. **Preview charts**: Review pace and heart rate profiles before export

## 🐛 Troubleshooting

- **Route not appearing**: Ensure at least 2 points are clicked on the map
- **Stats not updating**: Try refreshing the page
- **GPX not downloading**: Check browser download settings and permissions
- **Charts not showing**: Ensure route is drawn correctly and has sufficient points

## 🚀 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Happy Running! 🏃‍♂️💨**

*Note: This tool is for fun and experimentation. Remember that real exercise and outdoor activities are always the best choice for your health and fitness!*
