import type { TilesProduct } from '@/constants';
import { createScalarAtlasLayer } from '@/AtlasRenderingSystem';
import { useAtlasLayer } from './useAtlasLayer';

type UseScalarAtlasLayer = {
  map: React.RefObject<mapboxgl.Map | null>;
  product: TilesProduct;
};

export function useScalarAtlasLayer({ map, product }: UseScalarAtlasLayer) {
  useAtlasLayer({ map, product, createLayer: createScalarAtlasLayer });
}
