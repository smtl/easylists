const BLOCK_MINUTES = 30;

const pad = (value) => String(value).padStart(2, "0");

const toIcsDate = (date) =>
  `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(
    date.getUTCDate()
  )}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}00Z`;

// Rounds up to the next BLOCK_MINUTES slot so the suggested block starts
// "now-ish" rather than mid-interval. Opens Google Calendar's quick-add
// page on every device — on a phone this lands in the PWA's own webview
// rather than handing off to a native app, but saving there still syncs
// to whatever calendar the user's device is actually set up with (e.g.
// Samsung Calendar via a synced Google account), which is what matters.
export function openTimeBlock(title) {
  const start = new Date();
  start.setSeconds(0, 0);
  const remainder = start.getMinutes() % BLOCK_MINUTES;
  if (remainder !== 0) {
    start.setMinutes(start.getMinutes() + (BLOCK_MINUTES - remainder));
  }
  const end = new Date(start.getTime() + BLOCK_MINUTES * 60 * 1000);

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
}
