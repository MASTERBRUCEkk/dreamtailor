// Returns the current local date ("YYYY-MM-DD") and minutes-since-midnight
// for a given IANA timezone, using built-in Intl — no extra dependency.
export function getLocalTimeParts(timezone: string, now: Date = new Date()) {
  const dateFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const timeFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const dateStr = dateFormatter.format(now); // "YYYY-MM-DD" with en-CA locale
  const timeStr = timeFormatter.format(now); // "HH:MM"
  const [hours, minutes] = timeStr.split(":").map(Number);

  return { dateStr, minutesSinceMidnight: hours * 60 + minutes };
}

export function bedtimeToMinutes(bedtime: string) {
  const [hours, minutes] = bedtime.split(":").map(Number);
  return hours * 60 + (minutes || 0);
}

// True if `currentMinutes` falls within `windowMinutes` after the bedtime.
// A child with bedtime 20:00 and a 15-minute cron tick will match once,
// somewhere in the 20:00–20:14 window.
export function isWithinSendWindow(
  bedtime: string,
  currentMinutes: number,
  windowMinutes = 15
) {
  const bedtimeMinutes = bedtimeToMinutes(bedtime);
  return currentMinutes >= bedtimeMinutes && currentMinutes < bedtimeMinutes + windowMinutes;
}
