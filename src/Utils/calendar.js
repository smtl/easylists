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
// filename per title+time) rather than a client-side blob — most calendar
// apps register as file *viewers* for .ics, not as Web Share API targets,
// so navigator.share with a generated file often has nothing to hand off
// to even when canShare() said yes. A normal download is what reliably
// gets Android's "open with your calendar app" flow to kick in.
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
// quick-add page directly; a phone downloads a real .ics instead, since
// that's what lets the OS offer whatever calendar app the user actually
// uses (Samsung Calendar, Google Calendar, etc.) rather than assuming
// Google.
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
