/**
 * Finds the closest step value to a given number from a list of steps.
 *
 * Iterates through the provided `steps` array and returns the element
 * with the smallest absolute difference from the given `value`.
 *
 * @param value - The numeric value you want to snap.
 * @param steps - An array of step values to choose from.
 * @returns The step from `steps` closest to `value`.
 *
 * @example
 * snapToClosestStep(27, [0, 20, 40, 60]); // returns 20
 * snapToClosestStep(45, [0, 20, 40, 60]); // returns 40
 */
export function snapToClosestStep(value: number, steps: number[]): number {
  let closest = steps[0];
  let minDistance = Math.abs(value - closest);

  for (const step of steps) {
    const distance = Math.abs(value - step);
    if (distance < minDistance) {
      minDistance = distance;
      closest = step;
    }
  }

  return closest;
}
