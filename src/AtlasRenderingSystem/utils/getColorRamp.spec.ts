// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { getColorRamp } from './getColorRamp';

describe('getColorRamp', () => {
  it('returns a 256-stop × 4-channel byte array', () => {
    // jsdom's canvas 2d context exists but does not actually rasterize gradients,
    // so we stub getContext with a minimal recorder.
    const calls: Array<[string, unknown[]]> = [];
    const mockContext = {
      createLinearGradient: vi.fn(() => ({
        addColorStop: (...args: unknown[]) => calls.push(['addColorStop', args]),
      })),
      fillRect: vi.fn(),
      getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(256 * 4) })),
      set fillStyle(_v: unknown) {},
    };

    const realCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') {
        return {
          getContext: () => mockContext,
          width: 0,
          height: 0,
        } as unknown as HTMLCanvasElement;
      }
      return realCreateElement(tag);
    });

    const ramp = getColorRamp({ '0.00': '#ff0000', '1.00': '#0000ff' });

    expect(ramp).toBeInstanceOf(Uint8Array);
    expect(ramp.length).toBe(256 * 4);
    expect(mockContext.createLinearGradient).toHaveBeenCalledWith(0, 0, 256, 0);
    expect(calls).toEqual([
      ['addColorStop', [0, '#ff0000']],
      ['addColorStop', [1, '#0000ff']],
    ]);
    expect(mockContext.fillRect).toHaveBeenCalledWith(0, 0, 256, 1);

    vi.restoreAllMocks();
  });

  it('throws when canvas 2d context is unavailable', () => {
    const realCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') {
        return { getContext: () => null } as unknown as HTMLCanvasElement;
      }
      return realCreateElement(tag);
    });

    expect(() => getColorRamp({ '0.00': '#fff' })).toThrow(
      'Failed to get canvas context for color ramp',
    );

    vi.restoreAllMocks();
  });
});
