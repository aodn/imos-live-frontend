/**
 * Checks if the duration between two dates exceeds one month or one year.
 * @param {Date} startDate - The start date.
 * @param {Date} endDate - The end date.
 * @returns {Object} - { moreThanOneMonth: boolean, moreThanOneYear: boolean }
 */
export function checkDateDuration(startDate: Date, endDate: Date) {
  if (startDate > endDate) [startDate, endDate] = [endDate, startDate];

  const yearDiff = endDate.getFullYear() - startDate.getFullYear();
  const monthDiff = endDate.getMonth() - startDate.getMonth() + yearDiff * 12;

  return {
    moreThanOneMonth:
      monthDiff > 1 || (monthDiff === 1 && endDate.getDate() >= startDate.getDate()),
    moreThanOneYear:
      yearDiff > 1 ||
      (yearDiff === 1 &&
        (endDate.getMonth() > startDate.getMonth() ||
          (endDate.getMonth() === startDate.getMonth() &&
            endDate.getDate() >= startDate.getDate()))),
  };
}
