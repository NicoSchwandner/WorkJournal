import { isFriday as _isFriday, getISOWeek, addDays, endOfQuarter, endOfMonth, startOfDay } from "date-fns";

/**
 * Checks if a given date is a Friday.
 * Re-exported from date-fns.
 * @param d The date to check.
 * @returns True if the date is a Friday, false otherwise.
 */
export const isFriday = _isFriday;

/**
 * Gets the ISO week number of a given date.
 * Re-exported from date-fns.
 * @param d The date.
 * @returns The ISO week number.
 */
export const weekNum = getISOWeek;

/**
 * Checks if a given date is the last Friday of its month.
 * @param d The date to check.
 * @returns True if the date is the last Friday of the month, false otherwise.
 */
export function isEndOfMonthFriday(d: Date): boolean {
  // Normalize to the start of the day to avoid time zone issues
  const currentDate = startOfDay(d);
  const nextWeek = startOfDay(addDays(currentDate, 7));
  // Check if it's a Friday and if adding 7 days moves it to the next month
  return isFriday(currentDate) && currentDate.getMonth() !== nextWeek.getMonth();
}

/**
 * Checks if a given date is the last Friday of its quarter.
 * @param d The date to check.
 * @returns True if the date is the last Friday of the quarter, false otherwise.
 */
export function isEndOfQuarterFriday(d: Date): boolean {
  // Normalize to the start of the day
  const currentDate = startOfDay(d);
  const endOfQuarterDate = endOfQuarter(currentDate);
  const nextWeek = startOfDay(addDays(currentDate, 7));

  // Check if it's a Friday AND if the end of the quarter falls *before* the next Friday.
  // This means the current Friday is the last one in the quarter.
  return isFriday(currentDate) && endOfQuarterDate < nextWeek;
}

/**
 * Checks if a given date is the last Friday before a year-end cut-off date.
 * Useful for determining the last working Friday before a holiday break.
 * @param d The date to check.
 * @param cutOffDay The day of the month in December for the cut-off (e.g., 17 for December 17th).
 * @returns True if the date is the final Friday before the cut-off, false otherwise.
 */
export function isVacationFriday(d: Date, cutOffDay: number): boolean {
  if (!isFriday(d) || d.getMonth() !== 11) {
    // Must be a Friday in December
    return false;
  }
  // Normalize to the start of the day
  const currentDate = startOfDay(d);
  // Calculate the cut-off date for the current year
  const endYearCutOff = startOfDay(new Date(currentDate.getFullYear(), 11, cutOffDay));

  // Calculate the difference in days
  const diff = (endYearCutOff.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);

  // Is it the Friday *before* the cut-off week? (diff is between 0 and 6 inclusive)
  return diff >= 0 && diff < 7;
}
