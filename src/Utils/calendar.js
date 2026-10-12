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

// Rounds up to the next BLOCK_MINUTES slot so the suggested block starts
// "now-ish" rather than mid-interval. Hands off a standard .ics file rather
// than a Google-specific URL, so the OS's own calendar chooser decides which
// app opens it (Samsung Calendar, Google Calendar, Outlook, whatever the
// user actually has set as default) instead of assuming Google — and since
// this is a file share/download rather than a web navigation, it doesn't
// get trapped inside the PWA's own webview the way an https:// link did.
export async function openTimeBlock(title) {
  const start = new Date();
  start.setSeconds(0, 0);
  const remainder = start.getMinutes() % BLOCK_MINUTES;
  if (remainder !== 0) {
    start.setMinutes(start.getMinutes() + (BLOCK_MINUTES - remainder));
  }
  const end = new Date(start.getTime() + BLOCK_MINUTES * 60 * 1000);

  const ics = buildIcs(title, start, end);
  const file = new File([ics], "event.ics", { type: "text/calendar" });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch {
      return; // cancelled or unsupported mid-flight — don't also trigger the fallback
    }
  }

  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  window.location.href = url;
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
