// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useDrag } from './useDrag';

function fireMouse(type: 'mousemove' | 'mouseup', clientX = 0, clientY = 0) {
  const evt = new MouseEvent(type, { clientX, clientY, bubbles: true });
  document.dispatchEvent(evt);
}

function fireTouch(type: 'touchmove' | 'touchend', clientX = 0, clientY = 0) {
  const touch = { clientX, clientY } as Touch;
  const evt: any = new Event(type, { bubbles: true, cancelable: true });
  evt.touches = type === 'touchend' ? [] : [touch];
  evt.changedTouches = [touch];
  document.dispatchEvent(evt);
}

function makeMouseDown(clientX: number, clientY: number) {
  return {
    clientX,
    clientY,
    preventDefault: vi.fn(),
  } as unknown as React.MouseEvent;
}

function setupTarget() {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return { current: el } as React.RefObject<HTMLDivElement>;
}

describe('useDrag', () => {
  it('initialises at initialPosition with isDragging=false', () => {
    const { result } = renderHook(() =>
      useDrag({ targetRef: setupTarget(), initialPosition: { x: 5, y: 7 } }),
    );
    expect(result.current.position).toEqual({ x: 5, y: 7 });
    expect(result.current.isDragging).toBe(false);
  });

  it('does nothing on mousedown when disabled', () => {
    const onDragStart = vi.fn();
    const { result } = renderHook(() =>
      useDrag({ targetRef: setupTarget(), disabled: true, onDragStart }),
    );
    act(() => {
      result.current.dragHandlers.onMouseDown(makeMouseDown(0, 0));
    });
    expect(onDragStart).not.toHaveBeenCalled();
    expect(result.current.isDragging).toBe(false);
  });

  it('drags along the x axis, applying transform and onDrag', () => {
    const targetRef = setupTarget();
    const onDrag = vi.fn();
    const onDragEnd = vi.fn();
    const { result } = renderHook(() =>
      useDrag({ targetRef, constrainToAxis: 'x', onDrag, onDragEnd }),
    );

    act(() => result.current.dragHandlers.onMouseDown(makeMouseDown(0, 0)));
    act(() => fireMouse('mousemove', 50, 30));
    expect(onDrag).toHaveBeenCalledWith({ x: 50, y: 0 }, { x: 50, y: 30 });
    expect(targetRef.current.style.transform).toBe('translate(50px, 0px)');

    act(() => fireMouse('mouseup'));
    expect(onDragEnd).toHaveBeenCalledWith({ x: 50, y: 0 });
    expect(result.current.position).toEqual({ x: 50, y: 0 });
    expect(result.current.isDragging).toBe(false);
  });

  it('respects bounds via clamp', () => {
    const targetRef = setupTarget();
    const onDrag = vi.fn();
    const { result } = renderHook(() =>
      useDrag({
        targetRef,
        constrainToAxis: 'x',
        bounds: { left: -20, right: 0 },
        onDrag,
      }),
    );
    act(() => result.current.dragHandlers.onMouseDown(makeMouseDown(0, 0)));
    act(() => fireMouse('mousemove', -100, 0));
    expect(onDrag).toHaveBeenLastCalledWith({ x: -20, y: 0 }, { x: -100, y: 0 });

    act(() => fireMouse('mousemove', 100, 0));
    expect(onDrag).toHaveBeenLastCalledWith({ x: 0, y: 0 }, { x: 100, y: 0 });
  });

  it('fires onDragStarted exactly once per drag', () => {
    const onDragStarted = vi.fn();
    const targetRef = setupTarget();
    const { result } = renderHook(() => useDrag({ targetRef, onDragStarted }));
    act(() => result.current.dragHandlers.onMouseDown(makeMouseDown(0, 0)));
    act(() => fireMouse('mousemove', 10, 0));
    act(() => fireMouse('mousemove', 20, 0));
    act(() => fireMouse('mouseup'));
    expect(onDragStarted).toHaveBeenCalledTimes(1);
  });

  it('supports touch drag', () => {
    const onDrag = vi.fn();
    const onDragEnd = vi.fn();
    const targetRef = setupTarget();
    const { result } = renderHook(() => useDrag({ targetRef, onDrag, onDragEnd }));
    act(() => {
      result.current.dragHandlers.onTouchStart({
        touches: [{ clientX: 0, clientY: 0 }] as any,
      } as React.TouchEvent);
    });
    act(() => fireTouch('touchmove', 40, 60));
    expect(onDrag).toHaveBeenCalledWith({ x: 40, y: 60 }, { x: 40, y: 60 });
    act(() => fireTouch('touchend'));
    expect(onDragEnd).toHaveBeenCalledWith({ x: 40, y: 60 });
  });

  it('resetPosition writes the bounded position to state and transform', () => {
    const targetRef = setupTarget();
    const { result } = renderHook(() =>
      useDrag({
        targetRef,
        bounds: { left: -10, right: 10 },
      }),
    );
    act(() => result.current.resetPosition({ x: 50, y: 0 }));
    expect(result.current.position).toEqual({ x: 10, y: 0 });
    expect(targetRef.current.style.transform).toBe('translate(10px, 0px)');
  });
});
