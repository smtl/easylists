const BLOCK_MINUTES = 30;

const pad = (value) => String(value).padStart(2, "0");

const toIcsDate = (date) =>
  `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(
    date.getUTCDate()
  )}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}00Z`;

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
// filename per title+time). There's no Web Share API path here — Chrome's
// safelist of shareable file MIME types doesn't include text/calendar at
// all, so navigator.share({files: [...]}) can never succeed for an .ics
// regardless of timing or canShare() checks; a direct download is the
// only route available from the web platform for this.
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
// quick-add page directly; a phone downloads a real .ics, which is as far
// as the web platform can take this — getting it to open directly in a
// calendar app from there needs OS-level automation (e.g. MacroDroid)
// rather than anything the page itself can trigger.
export function openTimeBlock(title) {
  const start = new Date();
  start.setSeconds(0, 0);
  const remainder = start.getMinutes() % BLOCK_MINUTES;
  if (remainder !== 0) {
    start.setMinutes(start.getMinutes() + (BLOCK_MINUTES - remainder));
  }
  const end = new Date(start.getTime() + BLOCK_MINUTES * 60 * 1000);

  if (isTouchPrimary()) {
    openIcsDownload(title, start, end);
  } else {
    openGoogleCalendarTab(title, start, end);
  }
}
