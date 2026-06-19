export type DropdownOption = {
  value: string | number;
  label: string | number;
  disabled?: boolean;
  icon?: React.ReactNode;
  description?: string;
};

/** State handed to a custom trigger so it can drive open/close and reflect the selection. */
export type DropdownTriggerState = {
  isOpen: boolean;
  /** Toggle the menu open/closed. */
  toggle: () => void;
  /** Open the menu (e.g. on hover/focus). */
  open: () => void;
  /** Close the menu. */
  close: () => void;
  disabled: boolean;
  /** Currently selected option (single-select); first selected for multiple. */
  selectedOption: DropdownOption | undefined;
  /** All currently selected options (useful for `multiple`). */
  selectedOptions: DropdownOption[];
};

export type DropdownProps = {
  options: DropdownOption[];
  initialValue?: string | number | (string | number)[];
  /** Controlled value. When provided, the dropdown reflects this instead of its own state. */
  value?: string | number | (string | number)[];
  onChange?: (value: string | number | (string | number)[]) => void;
  /**
   * Render a custom trigger instead of the default button. Receives open/close
   * controls and the current selection so it can be wired to any element
   * (label, icon, hover target, …).
   */
  renderTrigger?: (state: DropdownTriggerState) => React.ReactNode;
  /** Close the menu when the pointer leaves the dropdown. Enables hover menus together with a custom trigger that calls `open`. */
  closeOnMouseLeave?: boolean;
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
  /** Show the check mark on the selected option. Default `true`; set `false` to indicate selection by row highlight instead. */
  showSelectedCheck?: boolean;
  /** Extra classes applied to the selected option row (e.g. a highlight background). */
  selectedOptionClassName?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  onSearch?: (query: string) => void;
  emptyMessage?: string;
  label?: string;
  required?: boolean;
  usePortal?: boolean;
};
export type OptionItemProps = {
  option: DropdownOption;
  isSelected: boolean;
  onSelect: (option: DropdownOption) => void;
  renderOption?: (option: DropdownOption, isSelected: boolean) => React.ReactNode;
  className?: string;
  selectedClassName?: string;
  showSelectedCheck?: boolean;
};
export type OptionsListProps = {
  options: DropdownOption[];
  value: string | number | (string | number)[];
  multiple: boolean;
  onSelect: (option: DropdownOption) => void;
  renderOption?: (option: DropdownOption, isSelected: boolean) => React.ReactNode;
  optionClassName?: string;
  selectedOptionClassName?: string;
  showSelectedCheck?: boolean;
  emptyMessage: string;
  maxHeight: string;
  hasSearch: boolean;
};
export type DropdownContentProps = {
  searchable: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filteredOptions: DropdownOption[];
  value: string | number | (string | number)[];
  multiple: boolean;
  onOptionSelect: (option: DropdownOption) => void;
  renderOption?: (option: DropdownOption, isSelected: boolean) => React.ReactNode;
  optionClassName?: string;
  selectedOptionClassName?: string;
  showSelectedCheck?: boolean;
  emptyMessage: string;
  maxHeight: string;
  dropdownClassName?: string;
  usePortal: boolean;
  dropdownPosition: 'top' | 'bottom';
  dropdownRect: { top: number; left: number; width: number };
  portalDropdownRef: React.RefObject<HTMLDivElement | null>;
};
export type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};
