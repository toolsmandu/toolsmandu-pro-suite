const TZ = 'Asia/Kathmandu';

export const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const y = parts.find(p => p.type === 'year')!.value;
  const m = parts.find(p => p.type === 'month')!.value;
  const dd = parts.find(p => p.type === 'day')!.value;
  return `${y}/${m}/${dd}`;
};

export const formatDateTime = (dateStr: string) => {
  const d = new Date(dateStr);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(d);
  const y = parts.find(p => p.type === 'year')!.value;
  const m = parts.find(p => p.type === 'month')!.value;
  const dd = parts.find(p => p.type === 'day')!.value;
  const hr = parts.find(p => p.type === 'hour')!.value;
  const min = parts.find(p => p.type === 'minute')!.value;
  const ampm = parts.find(p => p.type === 'dayPeriod')!.value;
  return `${y}/${m}/${dd} ${hr}:${min} ${ampm}`;
};

export const formatRelativeDate = (dateStr: string) => {
  const now = Date.now();
  const created = new Date(dateStr).getTime();
  const diffMs = now - created;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);

  if (diffMin < 60) return `${Math.max(1, diffMin)} Min Ago`;
  if (diffHr < 24) return `${diffHr} Hr Ago`;
  return formatDate(dateStr);
};

/** Current Kathmandu wall-clock time as YYYY-MM-DDTHH:mm (for datetime-local inputs) */
export const getKathmanduNowLocal = () => {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const y = parts.find(p => p.type === 'year')!.value;
  const m = parts.find(p => p.type === 'month')!.value;
  const d = parts.find(p => p.type === 'day')!.value;
  const hr = parts.find(p => p.type === 'hour')!.value;
  const min = parts.find(p => p.type === 'minute')!.value;
  return `${y}-${m}-${d}T${hr}:${min}`;
};

/** Convert a Kathmandu wall-clock string (YYYY-MM-DDTHH:mm) to a UTC ISO string */
export const kathmanduToUTC = (localStr: string) => {
  // Append the Nepal offset so JS parses it as Kathmandu time
  return new Date(localStr + ':00+05:45').toISOString();
};
