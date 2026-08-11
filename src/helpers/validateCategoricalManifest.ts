import {
  COLOR_OPTIONS,
  MHW_CATEGORY_LOOKUP,
  PRODUCT,
  PRODUCTLEGENDS,
  type TilesProduct,
} from '@/constants';
import type { ProductManifest } from '@/AtlasRenderingSystem';

const warned = new Set<string>();

// Checks that the fallback category constants in `src/constants/` still line
// up with the CF-conventions `flag_values` / `flag_meanings` published in the
// loaded `ProductManifest`. A mismatch means the colour ramp or popup labels
// are out of sync with the rendered tiles, so the visualisation looks fine
// but is silently wrong. Runs in prod too — drift is a data-side event, not a
// code bug, so dev-only would miss the case that actually matters; the
// `warned` Set dedupes so each distinct mismatch logs once per session.
export function validateCategoricalManifest(product: TilesProduct, manifest: ProductManifest) {
  const legend = PRODUCTLEGENDS[product];
  if (legend.scale !== 'category') return;

  const { flagValues, flagMeanings } = manifest;

  const expectedColors = COLOR_OPTIONS[legend.colorKey];
  if (flagValues && expectedColors.length !== flagValues.length) {
    warnOnce(
      `[${product}] palette '${legend.colorKey}' has ${expectedColors.length} colours but manifest flag_values has ${flagValues.length} — legend will be misaligned with the rendered tiles.`,
    );
  }

  if (product === PRODUCT.AUSTEMP_HEATWAVE_MHW_CATEGORY_MOSAIC && flagMeanings) {
    const expectedLabels = Object.values(MHW_CATEGORY_LOOKUP);
    if (expectedLabels.length !== flagMeanings.length) {
      warnOnce(
        `[${product}] MHW_CATEGORY_LOOKUP has ${expectedLabels.length} labels but manifest flag_meanings has ${flagMeanings.length} — popup category labels will be wrong.`,
      );
    } else {
      const mismatchIdx = expectedLabels.findIndex((label, i) => label !== flagMeanings[i]);
      if (mismatchIdx !== -1) {
        warnOnce(
          `[${product}] MHW_CATEGORY_LOOKUP[${mismatchIdx}]='${expectedLabels[mismatchIdx]}' but manifest flag_meanings[${mismatchIdx}]='${flagMeanings[mismatchIdx]}'.`,
        );
      }
    }
  }
}

function warnOnce(message: string) {
  if (warned.has(message)) return;
  warned.add(message);
  console.warn(message);
}
