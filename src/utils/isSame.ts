/**
 * Deeply compares two values to determine if they are equivalent.
 *
 * Supports primitives, arrays, and nested plain objects.
 * Comparison is order-sensitive for arrays and order-insensitive for object keys.
 *
 * @param {any} a - The first value to compare.
 * @param {any} b - The second value to compare.
 * @returns {boolean} - Returns true if values are deeply equal, false otherwise.
 *
 * @example
 * isSame(1, 1); // true
 * isSame([1, 2], [1, 2]); // true
 * isSame({ a: 1, b: 2 }, { b: 2, a: 1 }); // true
 * isSame({ a: 1 }, { a: 1, b: 2 }); // false
 * isSame({ x: { y: 2 } }, { x: { y: 2 } }); // true
 */
export function isSame(a: any, b: any): boolean {
  // Strict equality covers primitives & identical refs
  if (a === b) return true;

  // Handle null & undefined separately
  if (a == null || b == null) return false;

  // Compare arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, i) => isSame(val, b[i]));
  }

  // Compare plain objects
  if (
    typeof a === 'object' &&
    typeof b === 'object' &&
    Object.getPrototypeOf(a) === Object.getPrototypeOf(b)
  ) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;

    return keysA.every(key => keysB.includes(key) && isSame(a[key], b[key]));
  }

  return false;
}
