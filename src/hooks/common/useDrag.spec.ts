// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type React from 'react';
import { act, renderHook } from '@testing-library/react';
import { useDrag } from './useDrag';

// ── DOM drag simulation ─────────────────────────────────────────────────────
// onMouseDown is a React handler; the move/up listeners are attached to
// `document`, so those are dispatched as native events.
function mouseDown(handler: (e: React.MouseEvent) => void, x: number, y: number) {
  handler({ preventDefault: () => {}, clientX: x, clientY: y } as unknown as React.MouseEvent);
}
function move(x: number, y: number) {
  document.dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: y }));
}
function up() {
  document.dispatchEvent(new MouseEvent('mouseup'));
}

function makeTarget() {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('useDrag', () => {
  it('applies a translate transform and reports the delta during drag', () => {
    const el = makeTarget();
    const onDrag = vi.fn();
    const { result } = renderHook(() => useDrag({ targetRef: { current: el }, onDrag }));

    act(() => mouseDown(result.current.dragHandlers.onMouseDown, 100, 100));
    act(() => move(130, 120));

    expect(el.style.transform).toBe('translate(30px, 20px)');
    expect(onDrag).toHaveBeenLastCalledWith({ x: 30, y: 20 }, { x: 30, y: 20 });
  });

  it('clamps the dragged position to the provided bounds', () => {
    const el = makeTarget();
    const { result } = renderHook(() =>
      useDrag({
        targetRef: { current: el },
        bounds: { left: -10, right: 10, top: -5, bottom: 5 },
      }),
    );

    act(() => mouseDown(result.current.dragHandlers.onMouseDown, 0, 0));
    act(() => move(100, 100)); // raw (100,100) clamps to (10,5)

    expect(el.style.transform).toBe('translate(10px, 5px)');
  });

  it('locks the off-axis coordinate when constrainToAxis is set', () => {
    const el = makeTarget();
    const { result } = renderHook(() =>
      useDrag({ targetRef: { current: el }, constrainToAxis: 'x' }),
    );

    act(() => mouseDown(result.current.dragHandlers.onMouseDown, 0, 0));
    act(() => move(40, 99)); // y is locked to the start value (0)

    expect(el.style.transform).toBe('translate(40px, 0px)');
  });

  it('fires the lifecycle callbacks and commits the final position on mouseup', () => {
    const el = makeTarget();
    const onDragStart = vi.fn();
    const onDragStarted = vi.fn();
    const onDragEnd = vi.fn();
    const { result } = renderHook(() =>
      useDrag({ targetRef: { current: el }, onDragStart, onDragStarted, onDragEnd }),
    );

    act(() => mouseDown(result.current.dragHandlers.onMouseDown, 0, 0));
    expect(onDragStart).toHaveBeenCalledWith({ x: 0, y: 0 });
    expect(onDragStarted).not.toHaveBeenCalled(); // only once movement begins
    expect(result.current.isDragging).toBe(true);

    act(() => move(10, 10));
    expect(onDragStarted).toHaveBeenCalledTimes(1);

    act(() => up());
    expect(onDragEnd).toHaveBeenCalledWith({ x: 10, y: 10 });
    expect(result.current.position).toEqual({ x: 10, y: 10 }); // committed to state
    expect(result.current.isDragging).toBe(false);
  });

  it('does nothing when disabled', () => {
    const el = makeTarget();
    const onDragStart = vi.fn();
    const onDrag = vi.fn();
    const { result } = renderHook(() =>
      useDrag({ targetRef: { current: el }, disabled: true, onDragStart, onDrag }),
    );

    act(() => mouseDown(result.current.dragHandlers.onMouseDown, 0, 0));
    act(() => move(50, 50)); // no listener was attached, so this is a no-op

    expect(onDragStart).not.toHaveBeenCalled();
    expect(onDrag).not.toHaveBeenCalled();
    expect(result.current.isDragging).toBe(false);
  });

  it('resetPosition clamps to bounds and updates state + transform', () => {
    const el = makeTarget();
    const { result } = renderHook(() =>
      useDrag({ targetRef: { current: el }, bounds: { left: 0, right: 50, top: 0, bottom: 50 } }),
    );

    act(() => result.current.resetPosition({ x: 100, y: -20 }));

    expect(result.current.position).toEqual({ x: 50, y: 0 });
    expect(el.style.transform).toBe('translate(50px, 0px)');
  });
});
