import { RasterLayerSpecification } from 'mapbox-gl';
import { createLayer } from './layer';

export const imageLayer = createLayer<RasterLayerSpecification>('raster');
