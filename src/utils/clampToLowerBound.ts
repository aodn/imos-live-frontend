/**
 * Floors a given number to the lower bound of its step range.
 *
 * The steps array should be sorted in ascending order.
 * Example: If steps = [0, 20, 40] and value = 25, result = 20.
 *
 * @param value - The number to snap.
 * @param steps - Sorted array of possible lower-bound values.
 * @returns The lower-bound step for the given value.
 *
 * @example
 * clampToLowerBound(30, [0, 20, 40, 60]); // returns 20
 * clampToLowerBound(5, [0, 20, 40, 60]);  // returns 0
 */
export function clampToLowerBound(value: number, steps: number[]): number {
  let result = steps[0];
  for (let i = 0; i < steps.length; i++) {
    if (value >= steps[i]) {
      result = steps[i];
    } else {
      break;
    }
  }
  return result;
}
