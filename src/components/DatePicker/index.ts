// The single public door for the DatePicker component — a curated allowlist,
// not a wildcard. Internal helpers (buildAvailability, HeaderSelect, the
// Availability model, and the per-mode prop arms) are intentionally NOT
// re-exported; they are implementation details of DatePicker.

// ── Public component ──────────────────────────────────────────────────────────
export { DatePicker } from './DatePicker';

// ── Public types ──────────────────────────────────────────────────────────────
export type {
  // Props (discriminated union: range / list / unconstrained availability)
  DatePickerProps,
  // Per-slot styling overrides
  DatePickerClassNames,
} from './DatePicker';
