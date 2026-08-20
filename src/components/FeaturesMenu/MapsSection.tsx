import { Dropdown } from '../Dropdown';
import type { TIMEZONE } from '@/store';
import { useMapUIStore, setStyle, setTimezone } from '@/store';
import { useShallow } from 'zustand/shallow';
import type { StyleTitle } from '@/styles';
import { styles } from '@/styles';

const STYLE_OPTIONS = styles.map(s => ({
  label: s.title,
  value: s.title,
}));

const TIMEZONE_OPTIONS: { label: string; value: TIMEZONE }[] = [
  { label: 'UTC', value: 'UTC' },
  { label: 'LOCAL', value: 'LOCAL' },
];

export function MapsSection() {
  const { style, timezone } = useMapUIStore(
    useShallow(s => ({
      style: s.style,
      timezone: s.timezone,
    })),
  );

  const handleStyleChange = (value: string | number | (string | number)[]) => {
    setStyle(value as StyleTitle);
  };

  const handleTimezoneChange = (value: string | number | (string | number)[]) => {
    setTimezone(value as 'UTC' | 'LOCAL');
  };

  return (
    <div className="w-full flex flex-col gap-3">
      <Dropdown
        label="Map style"
        onChange={handleStyleChange}
        options={STYLE_OPTIONS}
        initialValue={style || STYLE_OPTIONS[0].value}
        position="auto"
        usePortal
      />
      <Dropdown
        label="Timezone selection"
        onChange={handleTimezoneChange}
        options={TIMEZONE_OPTIONS}
        initialValue={timezone || TIMEZONE_OPTIONS[0].value}
        position="auto"
        usePortal
      />
    </div>
  );
}
