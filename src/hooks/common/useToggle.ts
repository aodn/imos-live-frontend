import { useState } from 'react';

export function useToggle(v: boolean) {
  const [open, setOpen] = useState(v);
  return { open, toggle: () => setOpen(prev => !prev) };
}
