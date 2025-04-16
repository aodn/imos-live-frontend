const config = {
  // Number of particles
  nParticles: 10000,

  // Opacity of background screen, leading to fading of trails.
  // If 1, trails will never fade. If 0, there will be no trails.
  // As the fade happens every frame, a high number (>0.9)
  // is required to see any appreciable trails at all.
  fadeOpacity: 0.985,

  // A dial to adjust the speed of the particles
  // If the speed is too high, eventually particle trails will no longer be smooth
  speedFactor: 5.0,

  // Chance per frame that a particle will be deleted and moved to a new position
  dropRate: 0.003,

  // Increase in the drop rate for particles that are moving faster
  // Effectively, this number is multiplied by the fraction of the maximum velocity in the
  // vector field, and then added to the drop rate.
  // This prevents faster moving regions from visually dominating
  dropRateBump: 0.05,

  // Size of the particles in pixels
  pointSize: 1.2,

  // Colour gradient, the colours object is a pair of normilised speed with values (0-1) and hex colour strings.
  // The commented out one is the one used by early demonstrations
  // colours: {
  //   0.0: "#3288bd",
  //   0.1: "#66c2a5",
  //   0.2: "#abdda4",
  //   0.3: "#e6f598",
  //   0.4: "#fee08b",
  //   0.5: "#fdae61",
  //   0.6: "#f46d43",
  //   1.0: "#d53e4f",
  // },
  colours: {
    0.0: "#40E0D0",
    0.33: "#FF8C00",
    0.67: "#FF0080",
    1.0: "#f80759",
  },
};

export default config;
