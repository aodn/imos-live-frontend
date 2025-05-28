/**
 * Generates an array of years from start to end, spaced by the given step.
 *
 * @param start - Starting year (inclusive)
 * @param end - Ending year (inclusive)
 * @param step - Step between years (default is 5)
 * @returns Array of years
 */
/**
 * Generates an array of years from start to end, spaced by the given step.
 * Ensures the end year is always included.
 *
 * @param start - Starting year (inclusive)
 * @param end - Ending year (inclusive)
 * @param step - Step between years (default is 5)
 * @returns Array of years
 */
export function generateYearsByStep(start: number, end: number, step: number = 5): number[] {
  const years: number[] = [];

  for (let year = start; year <= end; year += step) {
    years.push(year);
  }

  // Ensure the end year is included if it wasn’t added by the loop
  if (years[years.length - 1] !== end) {
    years.push(end);
  }

  return years;
}
