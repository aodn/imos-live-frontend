import { COLOR_OPTIONS, PRODUCTLEGENDS, type TilesProduct } from '@/constants';
import type { ProductManifest } from '@/AtlasRenderingSystem';

const warned = new Set<string>();

// Checks that a categorical product's manifest matches what the renderer
// assumes: the palette in `src/constants/colors.ts` has one colour per CF
// `flag_values` entry, and the flags are consecutive integers from
// `valueRange[0]` (the shader's indexing scheme). Labels need no check — they
// are read straight from the manifest's `flag_meanings`. A mismatch means the
// map looks fine but is silently wrong. Runs in prod too — drift is a
// data-side event, not a code bug, so dev-only would miss the case that
// actually matters; the `warned` Set dedupes so each distinct mismatch logs
// once per session.
export function validateCategoricalManifest(product: TilesProduct, manifest: ProductManifest) {
  const legend = PRODUCTLEGENDS[product];
  if (legend.scale !== 'category') return;

  const { flagValues, valueRange } = manifest;

  const expectedColors = COLOR_OPTIONS[legend.colorKey];
  if (flagValues && expectedColors.length !== flagValues.length) {
    warnOnce(
      `[${product}] palette '${legend.colorKey}' has ${expectedColors.length} colours but manifest flag_values has ${flagValues.length} — legend will be misaligned with the rendered tiles.`,
    );
  }

  // The shader only reads `flagValues.length`: it maps a raw value to colour
  // slot `round(raw - valueRange[0])`, so the flags must be consecutive
  // integers starting at `valueRange[0]`. Anything else (offset start, gaps,
  // unsorted) paints the wrong colours while the popup — which looks values up
  // by `flagValues.indexOf` — still reports the correct category.
  if (flagValues && valueRange && flagValues.some((v, i) => v !== valueRange[0] + i)) {
    warnOnce(
      `[${product}] manifest flag_values [${flagValues.join(', ')}] are not consecutive integers starting at valueRange[0]=${valueRange[0]} — rendered category colours will be wrong.`,
    );
  }
}

function warnOnce(message: string) {
  if (warned.has(message)) return;
  warned.add(message);
  console.warn(message);
}
