export type ParticleConfig = {
  nParticles: number;
  fadeOpacity: number;
  speedFactor: number;
  dropRate: number;
  dropRateBump: number;
  pointSize: number;
};

export const FADE_OPACITY_RANGE = {
  min: 0.9,
  max: 0.99,
} as const;

export const SPEED_FACTOR_RANGE = {
  min: 1.0,
  max: 8.0,
} as const;

export const DROP_RATE_RANGE = {
  min: 0.0001,
  max: 0.02,
} as const;

export const DROP_RATE_BUMP_RANGE = {
  min: 0.0,
  max: 0.1,
} as const;

export const POINT_SIZE_RANGE = {
  min: 0.5,
  max: 5.0,
} as const;

export const DEFAULT_PARTICLE_CONFIG: ParticleConfig = {
  nParticles: 30000,
  // opacity of background screen, leading to fading of trails, related to trail length.
  fadeOpacity: 0.98,
  speedFactor: 4.5,
  // chance per frame that a particle will be deleted and moved to a new position
  dropRate: 0.002,
  // prevents faster moving regions from visually dominating
  dropRateBump: 0.05,
  pointSize: 0.9,
};

/**
 * FADE_OPACITY_OPTIONS

  Shader usage: floor(255.0 * color * u_opacity) / 255.0

  Math:
  - Applied every frame to fade background
  - At 60fps, value^60 = opacity after 1 second
  - 0.99^60 ≈ 0.55 (faded to 55% after 1 sec)
  - 0.995^60 ≈ 0.74 (faded to 74% after 1 sec)
  - 0.96^60 ≈ 0.13 (faded to 13% after 1 sec)

  Sensible range: 0.90 - 0.999
  - Below 0.90: trails disappear too quickly
  - Above 0.999: trails persist too long, visual clutter

  ---
  SPEED_FACTOR_OPTIONS

  Shader usage: offset = velocity * 0.0001 * u_speed_factor

  Math:
  - Position is normalized 0-1 (entire viewport)
  - Velocity from ocean currents typically 0-3 m/s
  - At velocity=1 m/s, speedFactor=4: offset = 0.0004/frame
  - At 60fps: moves 0.024 (2.4% of screen) per second

  Sensible range: 0.5 - 10.0
  - Below 0.5: particles barely move
  - Above 10.0: particles move too fast, trails not smooth

  ---
  DROP_RATE_OPTIONS

  Shader usage: step(1.0 - drop_rate, rand(seed))

  Math:
  - Probability per frame of particle respawn
  - Average particle lifetime = 1/drop_rate frames
  - At 0.001: avg lifetime = 1000 frames ≈ 16 seconds
  - At 0.01: avg lifetime = 100 frames ≈ 1.6 seconds

  Sensible range: 0.0001 - 0.02
  - Below 0.0001: particles rarely refresh, stale coverage
  - Above 0.02: particles respawn too fast, no flow continuity

  ---
  DROP_RATE_BUMP_OPTIONS

  Shader usage: drop_rate = u_drop_rate + speed_t * u_drop_rate_bump

  Math:
  - speed_t is normalized 0-1
  - At max speed (speed_t=1), full bump is added
  - Combined dropRate example: 0.005 + 1.0 * 0.1 = 0.105
  - Fast particle lifetime: 1/0.105 ≈ 9.5 frames ≈ 0.16 seconds (too short!)

  Sensible range: 0.0 - 0.1
  - Should be similar magnitude to dropRate
  - If dropRate max is 0.01, bump shouldn't exceed ~5-8x that

  ---
  POINT_SIZE_OPTIONS

  Shader usage: gl_PointSize = u_point_size

  Math:
  - Size in screen pixels
  - Below 1: may be invisible on some displays
  - Above 4-5: particles overlap significantly, blocky appearance

  Sensible range: 0.5 - 5.0
 */
