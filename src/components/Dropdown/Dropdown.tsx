import type React from 'react';
import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ArrowIcon, CloseIcon } from '../Icons';
import { cn } from '@/utils';
import { useDropdownOutsideClick } from './useDropdownOutsideClick';
import { useDropdownPosition } from './useDropdownPosition';
import type { DropdownProps, DropdownOption } from './type';
import { DropdownContent } from './DropdownContent';

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

export function Dropdown({
  options,
  initialValue,
  value: controlledValue,
  onChange,
  renderTrigger,
  closeOnMouseLeave = false,
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
  selectedOptionClassName,
  showSelectedCheck = true,
  scrollSelectedIntoView = true,
  renderOption,
  renderValue,
  onFocus,
  onBlur,
  onSearch,
  emptyMessage = 'No options found',
  label,
  required = false,
  usePortal = false,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [internalValue, setInternalValue] = useState<string | number | (string | number)[]>(
    initialValue ?? (multiple ? [] : ''),
  );

  // Controlled when `value` is provided; otherwise the dropdown manages its own state.
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const portalDropdownRef = useRef<HTMLDivElement>(null);
  const setTriggerRef = (el: HTMLElement | null) => {
    triggerRef.current = el;
  };

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

  const open = () => {
    if (disabled || isOpen) return;
    calculatePosition();
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(prev => {
      if (!prev) calculatePosition();
      return !prev;
    });
  };

  const commitValue = (newValue: string | number | (string | number)[]) => {
    if (!isControlled) setInternalValue(newValue);
    onChange?.(newValue);
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

    commitValue(newValue);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    commitValue(multiple ? [] : '');
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

  const selectedOptions = options.filter(opt =>
    Array.isArray(value) ? value.includes(opt.value) : opt.value === value,
  );

  return (
    <div
      className={cn('relative', className)}
      ref={!usePortal ? dropdownRef : undefined}
      onMouseLeave={closeOnMouseLeave ? close : undefined}
    >
      {label && (
        <label className="block text-sm font-medium text-imos-grey mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {renderTrigger ? (
        <span ref={setTriggerRef} className="inline-flex">
          {renderTrigger({
            isOpen,
            toggle: handleToggle,
            open,
            close,
            disabled,
            selectedOption: selectedOptions[0],
            selectedOptions,
          })}
        </span>
      ) : (
        <button
          ref={setTriggerRef}
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
            <ArrowIcon
              className={cn('text-gray-400 transition-transform duration-200', {
                'rotate-180': isOpen,
              })}
            />
          </div>
        </button>
      )}

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
              selectedOptionClassName={selectedOptionClassName}
              showSelectedCheck={showSelectedCheck}
              scrollSelectedIntoView={scrollSelectedIntoView}
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
            selectedOptionClassName={selectedOptionClassName}
            showSelectedCheck={showSelectedCheck}
            scrollSelectedIntoView={scrollSelectedIntoView}
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
}
