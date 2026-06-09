// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RefObject } from 'react';
import { renderHook } from '@testing-library/react';
import { useDropdownOutsideClick } from './useDropdownOutsideClick';

function ref<T>(el: T | null): RefObject<T | null> {
  return { current: el };
}
function mousedownOn(node: Node) {
  node.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('useDropdownOutsideClick', () => {
  it('does nothing while closed', () => {
    const outside = document.createElement('div');
    document.body.append(outside);
    const onClose = vi.fn();

    renderHook(() =>
      useDropdownOutsideClick(
        false,
        ref(document.createElement('button')),
        ref(null),
        ref(document.createElement('div')),
        false,
        onClose,
      ),
    );

    mousedownOn(outside);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('(non-portal) closes on mousedown outside the dropdown, not inside it', () => {
    const trigger = document.createElement('button');
    const dropdown = document.createElement('div');
    const outside = document.createElement('div');
    document.body.append(trigger, dropdown, outside);
    const onClose = vi.fn();

    renderHook(() =>
      useDropdownOutsideClick(true, ref(trigger), ref(null), ref(dropdown), false, onClose),
    );

    mousedownOn(outside);
    expect(onClose).toHaveBeenCalledTimes(1);

    mousedownOn(dropdown); // inside the dropdown container — no close
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('(portal) closes only when outside both the trigger and the portal dropdown', () => {
    const trigger = document.createElement('button');
    const portalDropdown = document.createElement('div');
    const outside = document.createElement('div');
    document.body.append(trigger, portalDropdown, outside);
    const onClose = vi.fn();

    renderHook(() =>
      useDropdownOutsideClick(true, ref(trigger), ref(portalDropdown), ref(null), true, onClose),
    );

    mousedownOn(trigger);
    expect(onClose).not.toHaveBeenCalled(); // inside trigger

    mousedownOn(portalDropdown);
    expect(onClose).not.toHaveBeenCalled(); // inside portal dropdown

    mousedownOn(outside);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('removes the listener on unmount', () => {
    const trigger = document.createElement('button');
    const dropdown = document.createElement('div');
    const outside = document.createElement('div');
    document.body.append(trigger, dropdown, outside);
    const onClose = vi.fn();

    const { unmount } = renderHook(() =>
      useDropdownOutsideClick(true, ref(trigger), ref(null), ref(dropdown), false, onClose),
    );

    unmount();
    mousedownOn(outside);
    expect(onClose).not.toHaveBeenCalled();
  });
});
