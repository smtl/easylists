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
// that's the actual thing that matters: is the normal download-and-open
// flow the more natural outcome here, or a browser tab.
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

// A real server-served .ics (Content-Disposition: attachment, a unique
// filename per title+time) rather than a client-side blob — this is the
// fallback path, reached only once any share attempt has already failed,
// so there's no user-gesture timing constraint left to protect here.
const openIcsDownload = (title, start, end) => {
  const params = new URLSearchParams({
    title,
    start: start.toISOString(),
    end: end.toISOString(),
  });
  window.location.href = `${import.meta.env.VITE_API_BASE_URL}/api/ics?${params.toString()}`;
};

// Rounds up to the next BLOCK_MINUTES slot so the suggested block starts
// "now-ish" rather than mid-interval. Desktop opens Google Calendar's
// quick-add page directly. A phone tries the share sheet first — if a
// calendar app (or an automation tool that can bridge to one) is offered
// there, great; any failure other than the user cancelling falls back to
// a direct download instead.
//
// The share attempt builds its .ics locally and calls navigator.share
// with no `await` ahead of it — browsers require that call to still be
// within the original tap's "user activation" window, which so much as
// one network round-trip beforehand (e.g. fetching a server-rendered
// file first) is enough to lose, silently turning every share attempt
// into an immediate, invisible failure.
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

  if (navigator.share) {
    const ics = buildIcs(title, start, end);
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

  openIcsDownload(title, start, end);
}
