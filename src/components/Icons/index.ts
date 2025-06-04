import { withIcon } from './withIcon';
import Close from './close.svg?react';
import Menu from './menu.svg?react';
import ArrowDown from './arrow_down.svg?react';
import DragIndicator from './drag_indicator.svg?react';
import Maps from './maps.svg?react';
import Layers from './layers.svg?react';
import Measures from './meaurement.svg?react';
import AddCircle from './add_circle.svg?react';
import MinusCircle from './minus_circle.svg?react';
import Hand from './hand.svg?react';
import Alert from './alert.svg?react';
import Config from './config.svg?react';
import Search from './search.svg?react';
import MapLayers from './map_layers.svg?react';
import WaterSurface from './water_surface.svg?react';
import Wave from './wave.svg?react';
import Radar from './radar.svg?react';
import Satellite from './satellite.svg?react';
import Widgets from './widgets.svg?react';
import Triangle from './triangle.svg?react';
import ImageError from './image_error.svg?react';
import Loader from './loader.svg?react';
import Loader2 from './loader_2.svg?react';

export const CloseIcon = withIcon(Close);
export const MenuIcon = withIcon(Menu);
export const ArrowDownIcon = withIcon(ArrowDown);
export const DragIndicatorIcon = withIcon(DragIndicator);
export const MapsIcon = withIcon(Maps);
export const LayersIcon = withIcon(Layers);
export const MeasuresIcon = withIcon(Measures);
export const AddCircleIcon = withIcon(AddCircle);
export const MinusCircleIcon = withIcon(MinusCircle);
export const HandIcon = withIcon(Hand);
export const AlertIcon = withIcon(Alert);
export const ConfigIcon = withIcon(Config);
export const SearchIcon = withIcon(Search);
export const MapLayersIcon = withIcon(MapLayers);
export const WaterSurfaceIcon = withIcon(WaterSurface);
export const WaveIcon = withIcon(Wave);
export const RadarIcon = withIcon(Radar);
export const SatelliteIcon = withIcon(Satellite);
export const WidgetsIcon = withIcon(Widgets);
export const TriangleIcon = withIcon(Triangle);
export const ImageErrorIcon = withIcon(ImageError);
export const LoaderIcon = withIcon(Loader);
export const Loader2Icon = withIcon(Loader2);

export const icons = {
  CloseIcon,
  MenuIcon,
  ArrowDownIcon,
  DragIndicatorIcon,
  MapsIcon,
  LayersIcon,
  MeasuresIcon,
  AddCircleIcon,
  MinusCircleIcon,
  HandIcon,
  AlertIcon,
  ConfigIcon,
  SearchIcon,
  MapLayersIcon,
  WaterSurfaceIcon,
  WaveIcon,
  RadarIcon,
  SatelliteIcon,
  WidgetsIcon,
  TriangleIcon,
  ImageErrorIcon,
  LoaderIcon,
  Loader2Icon,
};

export * from './withIcon';
export * from './IconTable';

/**
 * The PowerShell command to change all svg's fill to 'currentColor'
 * Get-ChildItem -Recurse -Filter *.svg | ForEach-Object {
    (Get-Content $_.FullName) -replace 'fill="[^"]*"', 'fill="currentColor"' | Set-Content $_.FullName
}
 
Mac/Linux command:
find ./src/icons -type f -name "*.svg" -exec sed -i '' 's/fill="[^"]*"/fill="currentColor"/g' {} +
*/
