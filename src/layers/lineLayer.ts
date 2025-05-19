import { LineLayerSpecification } from 'mapbox-gl';
import { createLayer } from './layer';

export const lineLayer = createLayer<LineLayerSpecification>('line');
