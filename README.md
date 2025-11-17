# imos-live

IMOS live project

# Ocean Current Visualization System

## Overview

This application visualizes ocean current data using WebGL-accelerated particle animation on an interactive MapBox map. The system loads the [processed Gridded Sea Level Anomaly (GSLA) data](./doc/DataProcessing.md) for different dates, renders the vector field using thousands of animated particles that follow the current patterns and a scalar heatmap image as overlay representing ocean surface anomalies. The visualization offers various customization options including map style, overlay visibility, particle count, and date selection.

## Key Features

- Interactive global map with multiple style options
- Real-time particle animation showing direction and speed of ocean currents
- Customizable particle density (1,000 to 100,000 particles)
- Optional data overlay visualization
- Time series navigation through 7 days of data (ending 3 days ago)
- WebGL-accelerated rendering for smooth animation

## Core Components

1. **App** (`App.jsx`) - Main application component managing state and coordinating child components
2. **MapComponent** (`MapComponent.jsx`) - Handles the MapBox map and vector field rendering
3. **MenuComponent** (`MenuComponent.jsx`) - User interface for controlling visualization parameters
4. **VectorField** (`VectorField.js`) - WebGL-based particle system for visualizing vector fields
5. **Utility modules** - Helper functions for data loading, URL building, and date handling

## [Technical Implementation](./doc/TechnicalDoc.md)

## User Interface

The interface consists of:

1. **Map View** - The main visualization area showing the animated particle system
2. **Control Menu** - A panel with options to configure the visualization:
   - **Styles** - Different map styles (Dark, Light, etc.)
   - **Overlay** - Toggle additional data visualization layer for sea level anomalies
   - **Particles** - Enable/disable particle animation
   - **Number** - Control particle count (1,000 to 100,000)
   - **Date** - Select from available dates in the time series

## Setup and Usage

### Prerequisites

- Mapbox API key (set as `VITE_MAPBOX_KEY` environment variable)
- Dataset base URL (set as `VITE_S3_BASE_URL` environment variable)

### Installation

1. Install dependencies:

   ```
   npm install
   ```

1. Set required environment variables:

   ```
   VITE_MAPBOX_KEY=your_mapbox_key_here
   VITE_S3_BASE_URL=[file server endpoint which contains the output of gsla_processing_script and wave_buoys_processing_script scripts]
   ```

1. Run the app:

   ```
   npm run dev
   ```

   You can run the frontend using mock data, which does not require the `VITE_S3_BASE_URL` environment variable. To start the application with randomly generated local data, use:

   ```
   npm run dev:mock
   ```

## Performance Considerations

- WebGL acceleration enables smooth animation of up to 100,000 particles
- Particle count can be adjusted based on device performance
- Animation automatically pauses during map interaction
- Efficient "ping-pong" texture technique minimizes GPU operations
