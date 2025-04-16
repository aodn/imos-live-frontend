/**
 * Generates an array of 7 dates ending 3 days before today.
 *
 * @returns {string[]} An array of date strings in YYYY-MM-DD format.
 */
export function getLast7DatesEnding3DaysAgo(): string[] {
  const dates = [];
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(today.getDate() - 3);
  for (let i = 6; i >= 0; i--) {
    const date = new Date(endDate);
    date.setDate(endDate.getDate() - i);

    const yy = String(date.getFullYear()).slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");

    dates.push(`${yy}-${mm}-${dd}`);
  }

  return dates;
}
