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

const icsUrl = (title, start, end) => {
  const params = new URLSearchParams({
    title,
    start: start.toISOString(),
    end: end.toISOString(),
  });
  return `${import.meta.env.VITE_API_BASE_URL}/api/ics?${params.toString()}`;
};

// A real server-served .ics (Content-Disposition: attachment, a unique
// filename per title+time) rather than a client-side blob. This is the
// reliable fallback: most calendar apps register as file *viewers* for
// .ics, not as Web Share API targets, so navigator.share with a generated
// file often has nothing calendar-shaped to hand off to — but a normal
// download reliably gets Android's "open with your calendar app" flow to
// kick in regardless.
const openIcsDownload = (title, start, end) => {
  window.location.href = icsUrl(title, start, end);
};

// Fetches the same .ics the download path would navigate to, as a real
// File, so it can be offered through the OS share sheet — lets the user
// pick whatever actually shows up there (a calendar app directly, or an
// automation tool that can bridge to one) rather than assuming a download
// is always the right move.
const shareIcsFile = async (title, start, end) => {
  const response = await fetch(icsUrl(title, start, end));
  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") || "";
  const fileName = disposition.match(/filename="?([^";]+)"?/)?.[1] || "event.ics";
  return new File([blob], fileName, { type: "text/calendar" });
};

// Rounds up to the next BLOCK_MINUTES slot so the suggested block starts
// "now-ish" rather than mid-interval. Desktop opens Google Calendar's
// quick-add page directly. A phone tries the share sheet first — if a
// calendar app (or an automation tool that can open one) is offered
// there, great; any failure other than the user cancelling falls back to
// a direct download instead.
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
    try {
      const file = await shareIcsFile(title, start, end);
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
