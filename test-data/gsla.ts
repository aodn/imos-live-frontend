import { promises } from 'fs';
import path from 'path';

const inputBitmapFile = promises.readFile(
  path.resolve(import.meta.dirname, 'GSLA', 'gsla_input.png'),
);
const overlayBitmapFile = promises.readFile(
  path.resolve(import.meta.dirname, 'GSLA', 'gsla_overlay.png'),
);
type GSLAMeta = {
  latRange: [number, number];
  lonRange: [number, number];
  uRange: [number, number];
  vRange: [number, number];
};

type GSLADatapoint = [uspeed: number, vspeed: number, gsla: number];
type GSLAData = {
  width: number;
  height: number;
  latRange: [number, number];
  lonRange: [number, number];
  data: GSLADatapoint[][];
};

const LAT_RANGE: GSLAMeta['latRange'] = [-50.0996015936255, 0.099601593625498];
const LON_RANGE: GSLAMeta['lonRange'] = [109.90033222591362, 170.09966777408638];

export const inputBitmap = () => inputBitmapFile;
export const overlayBitmap = () => overlayBitmapFile;
export const meta = (): GSLAMeta => {
  return {
    latRange: LAT_RANGE,
    lonRange: LON_RANGE,
    uRange: [-1.0690797567367554, 1.1372896432876587],
    vRange: [-1.1879510879516602, 1.6246776580810547],
  };
};
export const genRandomData = (): GSLAData => {
  return rasterDataGenerator(() => [Math.random(), Math.random(), Math.random()]);
};

export const genData = (dataPointValue: GSLADatapoint): GSLAData => {
  return rasterDataGenerator(() => dataPointValue);
};

function rasterDataGenerator(nextValue: () => GSLADatapoint): GSLAData {
  const width = 301,
    height = 251;
  const randomizer = (): GSLAData['data'] => {
    const data: GSLADatapoint[][] = [];
    for (let i = 0; i < height; i++) {
      const row: GSLADatapoint[] = [];
      for (let j = 0; j < width; j++) {
        row.push(nextValue());
      }
      data.push(row);
    }
    return data;
  };

  return {
    width,
    height,
    latRange: LAT_RANGE,
    lonRange: LON_RANGE,
    data: randomizer(),
  };
}
