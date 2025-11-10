import { FillLayerSpecification } from 'mapbox-gl';
import { createLayer } from './layer';

export const fillLayer = createLayer<FillLayerSpecification>('fill');
