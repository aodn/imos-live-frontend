import { useEffect, useRef } from 'react';
import { cn } from '@/utils';
import type {
  DropdownContentProps,
  OptionItemProps,
  OptionsListProps,
  SearchInputProps,
} from './type';
import { SearchIcon, CheckIcon } from '../Icons';

function SearchInput({ value, onChange, placeholder = 'Search options...' }: SearchInputProps) {
  return (
    <div className="p-2 border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
        />
      </div>
    </div>
  );
}

export function OptionItem({
  option,
  isSelected,
  onSelect,
  renderOption,
  className = '',
  selectedClassName = '',
  showSelectedCheck = true,
  buttonRef,
}: OptionItemProps) {
  return (
    <button
      ref={buttonRef}
      onClick={() => onSelect(option)}
      disabled={option.disabled}
      className={cn(
        'w-full px-3 py-2 cursor-pointer flex items-center justify-between text-left',
        {
          'opacity-50 cursor-not-allowed': option.disabled,
          'hover:bg-gray-50': !option.disabled,
          'bg-blue-50 text-blue-700': isSelected,
          'text-gray-900': !isSelected,
        },
        className,
        isSelected && selectedClassName,
      )}
    >
      {renderOption ? (
        renderOption(option, isSelected)
      ) : (
        <div className="flex items-center gap-2 grow">
          {option.icon && <span className="shrink-0">{option.icon}</span>}
          <div className="grow text-left">
            <div className="text-sm font-medium">{option.label}</div>
            {option.description && (
              <div className="text-xs text-gray-500">{option.description}</div>
            )}
          </div>
        </div>
      )}
      {isSelected && showSelectedCheck && <CheckIcon className="text-blue-600 shrink-0 ml-2" />}
    </button>
  );
}

export function OptionsList({
  options,
  value,
  multiple,
  onSelect,
  renderOption,
  optionClassName,
  selectedOptionClassName,
  showSelectedCheck,
  emptyMessage,
  maxHeight,
  hasSearch,
  scrollSelectedIntoView,
}: OptionsListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // On open, bring the (first) selected option into view within the scroll area.
  // No-op when disabled, nothing is selected, or the list isn't tall enough to scroll.
  useEffect(() => {
    if (!scrollSelectedIntoView) return;
    const container = scrollRef.current;
    const selected = selectedRef.current;
    if (!container || !selected) return;
    const cRect = container.getBoundingClientRect();
    const sRect = selected.getBoundingClientRect();
    container.scrollTop +=
      sRect.top - cRect.top - (container.clientHeight - selected.clientHeight) / 2;
  }, [scrollSelectedIntoView]);

  let selectedRefAssigned = false;

  return (
    <div
      ref={scrollRef}
      className="overflow-y-auto"
      style={{
        maxHeight: hasSearch ? `calc(${maxHeight} - 60px)` : maxHeight,
        overscrollBehavior: 'contain',
      }}
    >
      {options.length === 0 ? (
        <div className="px-3 py-2 text-sm text-gray-500 text-center">{emptyMessage}</div>
      ) : (
        options.map(option => {
          const isSelected = multiple
            ? Array.isArray(value) && value.includes(option.value)
            : value === option.value;
          // Attach the ref to the first selected option so it can be scrolled into view.
          const attachSelectedRef = isSelected && !selectedRefAssigned;
          if (attachSelectedRef) selectedRefAssigned = true;

          return (
            <OptionItem
              key={option.value}
              option={option}
              isSelected={isSelected}
              onSelect={onSelect}
              renderOption={renderOption}
              className={optionClassName}
              selectedClassName={selectedOptionClassName}
              showSelectedCheck={showSelectedCheck}
              buttonRef={attachSelectedRef ? selectedRef : undefined}
            />
          );
        })
      )}
    </div>
  );
}

export function DropdownContent({
  searchable,
  searchQuery,
  onSearchChange,
  filteredOptions,
  value,
  multiple,
  onOptionSelect,
  renderOption,
  optionClassName,
  selectedOptionClassName,
  showSelectedCheck,
  scrollSelectedIntoView,
  emptyMessage,
  maxHeight,
  dropdownClassName,
  usePortal,
  dropdownPosition,
  dropdownRect,
  portalDropdownRef,
}: DropdownContentProps) {
  const getContainerStyle = () => {
    if (usePortal) {
      return {
        top: dropdownRect.top,
        left: dropdownRect.left,
        width: dropdownRect.width,
        transform: dropdownPosition === 'top' ? 'translateY(calc(-100% - 8px))' : 'none',
        zIndex: 9999,
      };
    }
    return {
      maxHeight: maxHeight,
      overflowY: 'auto' as const,
    };
  };

  return (
    <div
      ref={portalDropdownRef}
      data-dropdown-portal={usePortal ? 'true' : 'false'}
      className={cn(
        'bg-white border border-gray-300 rounded-md shadow-lg',
        usePortal ? 'fixed' : 'absolute z-50 w-full',
        {
          'bottom-full mb-1': !usePortal && dropdownPosition === 'top',
          'top-full mt-1': !usePortal && dropdownPosition === 'bottom',
        },
        dropdownClassName,
      )}
      style={getContainerStyle()}
    >
      {searchable && <SearchInput value={searchQuery} onChange={onSearchChange} />}

      <OptionsList
        options={filteredOptions}
        value={value}
        multiple={multiple}
        onSelect={onOptionSelect}
        renderOption={renderOption}
        optionClassName={optionClassName}
        selectedOptionClassName={selectedOptionClassName}
        showSelectedCheck={showSelectedCheck}
        scrollSelectedIntoView={scrollSelectedIntoView}
        emptyMessage={emptyMessage}
        maxHeight={maxHeight}
        hasSearch={searchable}
      />
    </div>
  );
}
