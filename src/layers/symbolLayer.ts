import { SymbolLayerSpecification } from 'mapbox-gl';
import { createLayer } from './layer';

export const symbolLayer = createLayer<SymbolLayerSpecification>('symbol');
