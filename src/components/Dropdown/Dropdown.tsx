import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ArrowDownIcon, CloseIcon } from '../Icons';
import { cn } from '@/utils';
import { useDropdownOutsideClick, useDropdownPosition } from '@/hooks';
import { DropdownProps, DropdownOption } from './type';
import { DropdownContent } from './DropdoenContent';

const SIZE_CLASSES = {
  sm: 'px-2 py-1 text-sm min-h-[32px]',
  md: 'px-3 py-2 text-sm min-h-[40px]',
  lg: 'px-4 py-3 text-base min-h-[48px]',
} as const;

const VARIANT_CLASSES = {
  default:
    'bg-white border border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200',
  outline:
    'bg-transparent border-2 border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200',
  ghost:
    'bg-transparent border border-transparent hover:bg-gray-50 focus:bg-white focus:border-gray-300 focus:ring-2 focus:ring-blue-200',
} as const;

export const Dropdown = ({
  options,
  initialValue,
  onChange,
  placeholder = 'Select an option...',
  disabled = false,
  multiple = false,
  searchable = false,
  clearable = false,
  loading = false,
  error,
  size = 'md',
  variant = 'default',
  position = 'bottom',
  maxHeight = '200px',
  className = '',
  dropdownClassName = '',
  optionClassName = '',
  renderOption,
  renderValue,
  onFocus,
  onBlur,
  onSearch,
  emptyMessage = 'No options found',
  label,
  required = false,
  usePortal = false,
}: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [value, setValue] = useState<string | number | (string | number)[]>(
    initialValue ?? (multiple ? [] : ''),
  );

  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const portalDropdownRef = useRef<HTMLDivElement>(null);

  const { dropdownPosition, dropdownRect, calculatePosition } = useDropdownPosition(
    isOpen,
    triggerRef,
    position,
    maxHeight,
    usePortal,
  );

  useDropdownOutsideClick(isOpen, triggerRef, portalDropdownRef, dropdownRef, usePortal, () => {
    setIsOpen(false);
    setSearchQuery('');
  });

  const filteredOptions =
    searchable && searchQuery
      ? options.filter(
          opt =>
            String(opt.label).toLowerCase().includes(searchQuery.toLowerCase()) ||
            (opt.description &&
              String(opt.description).toLowerCase().includes(searchQuery.toLowerCase())),
        )
      : options;

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(prev => {
      if (!prev) calculatePosition();
      return !prev;
    });
  };

  const handleOptionSelect = (option: DropdownOption) => {
    if (option.disabled) return;

    let newValue: string | number | (string | number)[];

    if (multiple) {
      const currentValue = Array.isArray(value) ? value : [];
      newValue = currentValue.includes(option.value)
        ? currentValue.filter(v => v !== option.value)
        : [...currentValue, option.value];
    } else {
      newValue = option.value;
      setIsOpen(false);
      setSearchQuery('');
    }

    setValue(newValue);
    onChange?.(newValue);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newValue = multiple ? [] : '';
    setValue(newValue);
    onChange?.(newValue);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  const getDisplayValue = () => {
    if (multiple && Array.isArray(value)) {
      if (value.length === 0) return placeholder;
      if (value.length === 1) {
        const option = options.find(opt => opt.value === value[0]);
        return renderValue && option ? renderValue(option) : option?.label;
      }
      return `${value.length} selected`;
    } else {
      const option = options.find(opt => opt.value === value);
      if (!option) return placeholder;
      return renderValue ? renderValue(option) : option.label;
    }
  };

  const hasValue = value && (Array.isArray(value) ? value.length > 0 : value);

  return (
    <div className={`relative ${className}`} ref={!usePortal ? dropdownRef : undefined}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        onFocus={onFocus}
        onBlur={onBlur}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between rounded-md transition-colors duration-200',
          SIZE_CLASSES[size],
          VARIANT_CLASSES[variant],
          {
            'opacity-50 cursor-not-allowed': disabled,
            'cursor-pointer': !disabled,
            'border-red-500 focus:border-red-500 focus:ring-red-200': error,
            'ring-2 ring-blue-200': isOpen,
          },
        )}
      >
        <span
          className={cn('truncate', {
            'text-gray-500': !hasValue,
            'text-gray-900': hasValue,
          })}
        >
          {getDisplayValue()}
        </span>

        <div className="flex items-center gap-1 ml-2">
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600" />
          )}
          {clearable && hasValue && !disabled && (
            <CloseIcon
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
              onClick={handleClear}
            />
          )}
          <ArrowDownIcon
            className={cn('text-gray-400 transition-transform duration-200', {
              'rotate-180': isOpen,
            })}
          />
        </div>
      </button>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {isOpen &&
        (usePortal ? (
          createPortal(
            <DropdownContent
              searchable={searchable}
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              filteredOptions={filteredOptions}
              value={value}
              multiple={multiple}
              onOptionSelect={handleOptionSelect}
              renderOption={renderOption}
              optionClassName={optionClassName}
              emptyMessage={emptyMessage}
              maxHeight={maxHeight}
              dropdownClassName={dropdownClassName}
              usePortal={usePortal}
              dropdownPosition={dropdownPosition}
              dropdownRect={dropdownRect}
              portalDropdownRef={portalDropdownRef}
            />,
            document.body,
          )
        ) : (
          <DropdownContent
            searchable={searchable}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            filteredOptions={filteredOptions}
            value={value}
            multiple={multiple}
            onOptionSelect={handleOptionSelect}
            renderOption={renderOption}
            optionClassName={optionClassName}
            emptyMessage={emptyMessage}
            maxHeight={maxHeight}
            dropdownClassName={dropdownClassName}
            usePortal={usePortal}
            dropdownPosition={dropdownPosition}
            dropdownRect={dropdownRect}
            portalDropdownRef={portalDropdownRef}
          />
        ))}
    </div>
  );
};
