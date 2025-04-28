import { FixedLengthArray } from "@/types";

/**
 * Get the last 7 dates in the format "YY-MM-DD" ending 3 days ago.
 * The dates are in descending order, starting from 6 days ago to 3 days ago.
 * For example, if today is 2023-10-10, the output will be:
 * ["23-10-01", "23-10-02", "23-10-03", "23-10-04", "23-10-05", "23-10-06", "23-10-07"]
 * @returns Last 7 dates in the format "YY-MM-DD" ending 3 days ago.
 */
export function getLast7DatesEnding3DaysAgo(): FixedLengthArray<string, 7> {
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

  return dates as FixedLengthArray<string, 7>;
}
