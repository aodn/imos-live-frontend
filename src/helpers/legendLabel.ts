import type { ProductManifest } from '@/AtlasRenderingSystem';

/**
 * Unit of the quantity a manifest renders. Scalar products publish
 * `valueUnit`; particle products publish `uUnit`/`vUnit` for the velocity
 * components, and the rendered speed shares their unit when they agree.
 */
export function getManifestUnit(manifest: ProductManifest): string | undefined {
  if (manifest.valueUnit) return manifest.valueUnit;
  const { uUnit, vUnit } = manifest;
  return uUnit && uUnit === vUnit ? uUnit : undefined;
}

/** Legend caption: the quantity name, with the manifest's unit appended once known. */
export function formatLegendLabel(label: string, unit?: string): string {
  return unit ? `${label} (${unit})` : label;
}
