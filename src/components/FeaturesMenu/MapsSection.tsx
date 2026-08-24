import { Dropdown } from '../Dropdown';
import { useMapUIStore, setStyle } from '@/store';
import { useShallow } from 'zustand/shallow';
import type { StyleTitle } from '@/styles';
import { styles } from '@/styles';

const STYLE_OPTIONS = styles.map(s => ({
  label: s.title,
  value: s.title,
}));

export function MapsSection() {
  const { style } = useMapUIStore(
    useShallow(s => ({
      style: s.style,
    })),
  );

  const handleStyleChange = (value: string | number | (string | number)[]) => {
    setStyle(value as StyleTitle);
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
    </div>
  );
}
