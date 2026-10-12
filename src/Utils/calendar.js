const BLOCK_MINUTES = 30;

const pad = (value) => String(value).padStart(2, "0");

const toIcsDate = (date) =>
  `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(
    date.getUTCDate()
  )}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}00Z`;

// Backslash, comma, semicolon and newlines need escaping in ICS text values (RFC 5545).
const escapeIcsText = (text) =>
  text.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");

const buildIcs = (title, start, end) => {
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@easylists.app`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EasyLists//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${escapeIcsText(title)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
};

// Touch-primary (coarse pointer) stands in for "phone-like" here, since
// that's the actual thing that matters: does this device have an OS share
// sheet worth using, or is a browser tab the more natural outcome.
const isTouchPrimary = () =>
  typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;

const openGoogleCalendarTab = (title, start, end) => {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${toIcsDate(start)}/${toIcsDate(end)}`,
  });
  window.open(
    `https://calendar.google.com/calendar/render?${params.toString()}`,
    "_blank",
    "noopener,noreferrer"
  );
};

const downloadIcs = (ics) => {
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "event.ics";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};

// Rounds up to the next BLOCK_MINUTES slot so the suggested block starts
// "now-ish" rather than mid-interval.
//
// Desktop opens Google Calendar's quick-add page in a new tab — the most
// useful outcome there, and avoids a flaky Web Share API path on platforms
// where it's inconsistently supported. On a phone, a generated .ics file is
// handed to the OS share sheet instead, since that's what lets the user
// pick whatever calendar app they actually use (Samsung Calendar, Google
// Calendar, etc.) rather than assuming Google. canShare() isn't used to
// gate this — it can under-report support for less common file types,
// which would block the real share attempt before it's even tried; share()
// itself rejecting is a reliable enough signal to fall back from.
export async function openTimeBlock(title) {
  const start = new Date();
  start.setSeconds(0, 0);
  const remainder = start.getMinutes() % BLOCK_MINUTES;
  if (remainder !== 0) {
    start.setMinutes(start.getMinutes() + (BLOCK_MINUTES - remainder));
  }
  const end = new Date(start.getTime() + BLOCK_MINUTES * 60 * 1000);

  if (!isTouchPrimary()) {
    openGoogleCalendarTab(title, start, end);
    return;
  }

  const ics = buildIcs(title, start, end);

  if (navigator.share) {
    const file = new File([ics], "event.ics", { type: "text/calendar" });
    try {
      await navigator.share({ files: [file] });
      return;
    } catch (err) {
      if (err.name === "AbortError") {
        return; // the user closed the share sheet — respect that, no fallback
      }
    }
  }

  downloadIcs(ics);
}
