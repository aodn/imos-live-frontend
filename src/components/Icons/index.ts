import { withIcon } from './withIcon';
import Close from './close.svg?react';
import Menu from './menu.svg?react';
import ArrowDown from './arrow_down.svg?react';
import DragIndicator from './drag_indicator.svg?react';

export const CloseIcon = withIcon(Close);
export const MenuIcon = withIcon(Menu);
export const ArrowDownIcon = withIcon(ArrowDown);
export const DragIndicatorIcon = withIcon(DragIndicator);

export const icons = {
  CloseIcon,
  MenuIcon,
  ArrowDownIcon,
  DragIndicatorIcon,
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
