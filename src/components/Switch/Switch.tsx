import { useState } from 'react';
import { cn } from '@/utils';

interface SwitchProps {
  initialValue?: boolean;
  onChange?: (value: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  label?: string;
  description?: string;
  labelPosition?: 'left' | 'right';
  showIcons?: boolean;
  customColors?: {
    on?: string;
    off?: string;
    thumb?: string;
    thumbOn?: string;
  };
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  className?: string;
  thumbClassName?: string;
  trackClassName?: string;
  labelClassName?: string;
  descriptionClassName?: string;
}

export const Switch = ({
  initialValue = false,
  onChange,
  disabled = false,
  size = 'md',
  variant = 'default',
  label,
  description,
  labelPosition = 'right',
  showIcons = false,
  customColors,
  rounded = 'full',
  className,
  thumbClassName,
  trackClassName,
  labelClassName,
  descriptionClassName,
}: SwitchProps) => {
  const [isOn, setIsOn] = useState(initialValue);

  const handleToggle = () => {
    if (disabled) return;
    const newValue = !isOn;
    setIsOn(newValue);
    onChange?.(newValue);
  };

  // Size configurations
  const sizeConfig = {
    sm: {
      track: 'w-8 h-4',
      thumb: 'w-3 h-3',
      translate: 'translate-x-4',
      padding: 'p-0.5',
      icon: 'w-2 h-2',
    },
    md: {
      track: 'w-11 h-6',
      thumb: 'w-5 h-5',
      translate: 'translate-x-5',
      padding: 'p-0.5',
      icon: 'w-3 h-3',
    },
    lg: {
      track: 'w-14 h-8',
      thumb: 'w-7 h-7',
      translate: 'translate-x-6',
      padding: 'p-0.5',
      icon: 'w-4 h-4',
    },
  };

  // Variant colors
  const variantColors = {
    default: 'bg-blue-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    danger: 'bg-red-600',
    info: 'bg-cyan-600',
  };

  // Rounded configurations
  const roundedConfig = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  const config = sizeConfig[size];
  const activeColor = customColors?.on || variantColors[variant];
  const inactiveColor = customColors?.off || 'bg-gray-300';
  const thumbColor = isOn ? customColors?.thumbOn || 'bg-white' : customColors?.thumb || 'bg-white';

  const CheckIcon = () => (
    <svg className={cn(config.icon, 'text-green-500')} fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );

  const XIcon = () => (
    <svg className={cn(config.icon, 'text-red-500')} fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );

  const switchElement = (
    <button
      onClick={handleToggle}
      disabled={disabled}
      className={cn(
        'relative inline-flex items-center transition-colors duration-200 ease-in-out',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ',
        config.track,
        config.padding,
        isOn ? activeColor : inactiveColor,
        roundedConfig[rounded],
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        trackClassName,
        className,
      )}
      role="switch"
      aria-checked={isOn}
      aria-disabled={disabled}
    >
      <span
        className={cn(
          'inline-block transform transition-transform duration-200 ease-in-out shadow-md',
          'flex items-center justify-center',
          config.thumb,
          isOn ? config.translate : 'translate-x-0',
          thumbColor,
          roundedConfig[rounded],
          thumbClassName,
        )}
      >
        {showIcons && (
          <span className="flex items-center justify-center">
            {isOn ? <CheckIcon /> : <XIcon />}
          </span>
        )}
      </span>
    </button>
  );

  const labelElement = label && (
    <div className="flex flex-col">
      <span className={cn('text-sm font-medium text-gray-900', labelClassName)}>{label}</span>
      {description && (
        <span className={cn('text-xs text-gray-500', descriptionClassName)}>{description}</span>
      )}
    </div>
  );

  if (!label) {
    return switchElement;
  }

  return (
    <div className={cn('flex items-center gap-3', labelPosition === 'left' && 'flex-row-reverse')}>
      {switchElement}
      {labelElement}
    </div>
  );
};
