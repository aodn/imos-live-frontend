import { withIcon } from './withIcon';
import Close from './close.svg?react';
import Menu from './menu.svg?react';
import ArrowDown from './arrow_down.svg?react';
import DragIndicator from './drag_indicator.svg?react';
import Maps from './maps.svg?react';
import Layers from './layers.svg?react';
import Measures from './meaurement.svg?react';

export const CloseIcon = withIcon(Close);
export const MenuIcon = withIcon(Menu);
export const ArrowDownIcon = withIcon(ArrowDown);
export const DragIndicatorIcon = withIcon(DragIndicator);
export const MapsIcon = withIcon(Maps);
export const LayersIcon = withIcon(Layers);
export const MeasuresIcon = withIcon(Measures);

export const icons = {
  CloseIcon,
  MenuIcon,
  ArrowDownIcon,
  DragIndicatorIcon,
  MapsIcon,
  LayersIcon,
  MeasuresIcon,
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
