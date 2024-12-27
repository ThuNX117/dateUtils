// import { format, toDate, toZonedTime  } from 'date-fns-tz';
import { DateTime } from "luxon"

/**
 * Gets the current timezone of the user's device.
 *
 * @returns {string} - The IANA timezone identifier of the user's device (e.g., 'Asia/Kuala_Lumpur').
 *
 * @example
 * // Get the current timezone of the user's device
 * const userTimezone = getLocalCurrentTimeZone();
 * console.log(userTimezone); // Output might be 'Asia/Kuala_Lumpur'
 */
function getLocalCurrentTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

/**
 * Normalizes time strings that might incorrectly display '24:' as the hour.
 *
 * In some cases, especially around midnight, time formatting can produce '24:xx:xx'
 * which is not a valid time format. This function replaces '24:' with '00:' to ensure
 * consistency and correctness in the time representation.
 *
 * @param {string} time - The time string to normalize, potentially containing '24:'.
 * @returns {string} - The normalized time string where '24:' is replaced with '00:'.
 */
function normalizeTime(time) {
  return time.replace(/24:/, "00:")
}

/**
 * Formats the given date and time to the specified timezone.
 *
 * @param {string} timezone - The target timezone for conversion (e.g., 'Asia/Kuala_Lumpur').
 * @param {string} [datetime] - An optional datetime string in UTC or local time.
 * @param {string} format - The desired format for the date and/or time (e.g., 'YYYY-MM-DD', 'HH:mm:ss', 'YYYY-MM-DD HH:mm:ss').
 * @param {boolean} formatInUtc - Whether the input datetime is in UTC (default: true).
 * @param {boolean} fullMonth - Whether the show month in full name format like , May 16
 * @returns {string} - The formatted date and time in the specified timezone.
 *
 * @example
 * // Get the current time in the 'Asia/Kuala_Lumpur' timezone
 * convertToTimezone('Asia/Kuala_Lumpur', 'YYYY-MM-DD');
 *
 * @example
 * // Convert a specific date and time to the 'Asia/Kuala_Lumpur' timezone
 * convertToTimezone('Asia/Kuala_Lumpur', '2023-10-04T14:56:43.000000Z', 'YYYY-MM-DD HH:mm:ss');
 */
function convertToTimezone(
  timezone,
  dateTime,
  format,
  formatInUtc = true,
  fullMonth = false
) {
  // Determine whether to interpret the input date as local time or UTC time
  if (!dateTime) return null
  const date = !formatInUtc ? new Date(dateTime + "Z") : new Date(dateTime)

  const formatDatePart = options => {
    return new Intl.DateTimeFormat(undefined, options)
      .formatToParts(date)
      .reduce((acc, part) => {
        if (part.type !== "literal") {
          acc[part.type] = part.value
        }
        return acc
      }, {})
  }

  const dateParts = formatDatePart({
    timeZone: timezone,
    year: "numeric",
    month: fullMonth ? "long" : "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  })

  const formatDate = format => {
    let formatted = format
      .replace("YYYY", dateParts.year)
      .replace("MM", dateParts.month)
      .replace("DD", dateParts.day)
      .replace("HH", dateParts.hour)
      .replace("mm", dateParts.minute)
      .replace("ss", dateParts.second)
    return normalizeTime(formatted)
  }
  return formatDate(format)
}

/**
 * Converts a local date-time string to UTC.
 *
 * @param {string} dateTime - The local date-time string (e.g., '2024-01-17T01:39:48').
 * @param {string} timezone - The timezone of the local date-time (e.g., 'Asia/Kuala_Lumpur').
 * @returns {string} - The converted UTC date-time string (e.g., '2024-01-16T17:39:48.000000Z').
 */
function convertLocalDateToDefaultUtc(dateTime, timezone) {
  const localDate = DateTime.fromISO(dateTime, { zone: timezone })

  // Convert the local date-time to UTC
  const utcDate = localDate.toUTC()

  // ISO format includes milliseconds and is in UTC
  const formattedDate = utcDate.toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'000Z'")

  return formattedDate
}

/**
 * Converts a local date-time string to UTC, use for end date(end of day)
 *
 * @param {string} dateTime - The local date-time string (e.g., '2024-07-22T23:59:59.999999').
 * @param {string} timezone - The timezone of the local date-time (e.g., 'Asia/Kuala_Lumpur').
 * @returns {string} - The converted UTC date-time string (e.g., '2024-07-22T15:59:59.999999Z').
 */
function convertLocalDateToUtcMicroseconds(dateTime, timezone) {
  // Parse the local date-time string with the specified time zone
  const localDate = DateTime.fromISO(dateTime, { zone: timezone })

  // Convert the local date-time to UTC
  const utcDate = localDate.toUTC()

  // Extract the fractional seconds from the input string
  const timePart = dateTime.split("T")[1]
  const fraction = timePart.includes(".") ? timePart.split(".")[1] : "000000"

  // Ensure fraction is exactly 6 digits
  const formattedFraction = fraction.padEnd(6, "0").substring(0, 6)

  // Format the UTC date-time
  const formattedDate = utcDate.toFormat("yyyy-MM-dd'T'HH:mm:ss")

  // Combine the formatted date with the microseconds part
  return `${formattedDate}.${formattedFraction}Z`
}

// format date to ISO format
function formatDateToISO(date) {
  return DateTime.fromFormat(date, "yyyy-MM-dd HH:mm:ss").toFormat(
    "yyyy-MM-dd'T'HH:mm:ss"
  )
}

// get timezone info
const getTimeZoneInfo = zone => {
  const now = DateTime.now().setZone(zone)
  const offset = now.toFormat("ZZ") // UTC offset in ±HH:MM format
  const abbreviation = now.toFormat("ZZZZ") // Time zone abbreviation
  const observesDST = now.offset > now.startOf("year").offset

  return {
    zone,
    offset: `GMT${offset}`,
    abbreviation,
    observesDST
  }
}
export default {
  getLocalCurrentTimeZone,
  convertToTimezone,
  convertLocalDateToDefaultUtc,
  convertLocalDateToUtcMicroseconds,
  formatDateToISO,
  getTimeZoneInfo
}
