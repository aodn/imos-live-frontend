export interface DropdownOption {
  value: string | number;
  label: string | number;
  disabled?: boolean;
  icon?: React.ReactNode;
  description?: string;
}

export interface DropdownProps {
  options: DropdownOption[];
  initialValue?: string | number | (string | number)[];
  onChange?: (value: string | number | (string | number)[]) => void;
  placeholder?: string;
  disabled?: boolean;
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  loading?: boolean;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  position?: 'bottom' | 'top' | 'auto';
  maxHeight?: string;
  className?: string;
  dropdownClassName?: string;
  optionClassName?: string;
  renderOption?: (option: DropdownOption, isSelected: boolean) => React.ReactNode;
  renderValue?: (option: DropdownOption) => React.ReactNode;
  onFocus?: () => void;
  onBlur?: () => void;
  onSearch?: (query: string) => void;
  emptyMessage?: string;
  label?: string;
  required?: boolean;
  usePortal?: boolean;
}
export interface OptionItemProps {
  option: DropdownOption;
  isSelected: boolean;
  onSelect: (option: DropdownOption) => void;
  renderOption?: (option: DropdownOption, isSelected: boolean) => React.ReactNode;
  className?: string;
}
export interface OptionsListProps {
  options: DropdownOption[];
  value: string | number | (string | number)[];
  multiple: boolean;
  onSelect: (option: DropdownOption) => void;
  renderOption?: (option: DropdownOption, isSelected: boolean) => React.ReactNode;
  optionClassName?: string;
  emptyMessage: string;
  maxHeight: string;
  hasSearch: boolean;
}
export interface DropdownContentProps {
  searchable: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filteredOptions: DropdownOption[];
  value: string | number | (string | number)[];
  multiple: boolean;
  onOptionSelect: (option: DropdownOption) => void;
  renderOption?: (option: DropdownOption, isSelected: boolean) => React.ReactNode;
  optionClassName?: string;
  emptyMessage: string;
  maxHeight: string;
  dropdownClassName?: string;
  usePortal: boolean;
  dropdownPosition: 'top' | 'bottom';
  dropdownRect: { top: number; left: number; width: number };
  portalDropdownRef: React.RefObject<HTMLDivElement | null>;
}
export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}
