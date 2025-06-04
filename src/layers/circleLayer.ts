import { CircleLayerSpecification } from 'mapbox-gl';
import { createLayer } from './layer';

export const circleLayer = createLayer<CircleLayerSpecification>('circle');
