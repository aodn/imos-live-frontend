// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Switch } from './Switch';

describe('Switch', () => {
  afterEach(cleanup);

  it('toggles its own state when uncontrolled', () => {
    const onChange = vi.fn();
    render(<Switch onChange={onChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('true');
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('follows `checked` and ignores clicks until the parent updates it', () => {
    const onChange = vi.fn();
    const { rerender } = render(<Switch checked={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('false');

    rerender(<Switch checked onChange={onChange} />);
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('true');
  });

  it('switches off when `checked` changes from outside', () => {
    const { rerender } = render(<Switch checked />);
    rerender(<Switch checked={false} />);
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('false');
  });
});
