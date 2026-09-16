export const DEFAULT_UNLOCK_TIME_ZONE = 'Asia/Ho_Chi_Minh';

export const SUPPORTED_TIME_ZONES = [
  { value: 'Asia/Ho_Chi_Minh', label: 'Asia/Ho_Chi_Minh (GMT+7)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (GMT+8)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (GMT+9)' },
  { value: 'UTC', label: 'UTC (GMT+0)' },
  { value: 'Europe/London', label: 'Europe/London' },
  { value: 'America/New_York', label: 'America/New_York' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles' },
] as const;

type ZonedParts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, Number(part.value)]));
  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second,
  };
}

function getTimeZoneOffset(date: Date, timeZone: string) {
  const parts = getZonedParts(date, timeZone);
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) - date.getTime();
}

function isSameLocalTime(parts: ZonedParts, expected: ZonedParts) {
  return parts.year === expected.year && parts.month === expected.month && parts.day === expected.day
    && parts.hour === expected.hour && parts.minute === expected.minute && parts.second === expected.second;
}

export function isValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format();
    return true;
  } catch {
    return false;
  }
}

export function zonedDateTimeToUtc(dateValue: string, timeValue: string, timeZone: string) {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeValue);
  if (!dateMatch || !timeMatch) throw new Error('Hãy nhập ngày và giờ mở hợp lệ.');
  if (!isValidTimeZone(timeZone)) throw new Error('Múi giờ không hợp lệ.');

  const expected: ZonedParts = {
    year: Number(dateMatch[1]),
    month: Number(dateMatch[2]),
    day: Number(dateMatch[3]),
    hour: Number(timeMatch[1]),
    minute: Number(timeMatch[2]),
    second: 0,
  };
  const naiveUtc = Date.UTC(expected.year, expected.month - 1, expected.day, expected.hour, expected.minute, 0);
  const normalized = new Date(naiveUtc);
  if (normalized.getUTCFullYear() !== expected.year || normalized.getUTCMonth() !== expected.month - 1 || normalized.getUTCDate() !== expected.day || expected.hour > 23 || expected.minute > 59) {
    throw new Error('Ngày hoặc giờ mở không hợp lệ.');
  }

  let candidate = naiveUtc;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const next = naiveUtc - getTimeZoneOffset(new Date(candidate), timeZone);
    if (next === candidate) break;
    candidate = next;
  }
  if (!isSameLocalTime(getZonedParts(new Date(candidate), timeZone), expected)) {
    throw new Error('Giờ mở không tồn tại trong múi giờ đã chọn.');
  }
  return new Date(candidate).toISOString();
}

export function getRemainingMs(unlockAt: string, now = Date.now()) {
  const timestamp = Date.parse(unlockAt);
  if (!Number.isFinite(timestamp)) return null;
  return Math.max(0, timestamp - now);
}

export function formatCountdown(remainingMs: number) {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
  };
}

export function formatUnlockAt(unlockAt: string, timeZone: string) {
  const date = new Date(unlockAt);
  const parts = new Intl.DateTimeFormat('vi-VN', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  const zoneParts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'shortOffset', hour: '2-digit' }).formatToParts(date);
  return {
    date: `${values.day}/${values.month}/${values.year}`,
    time: `${values.hour}:${values.minute}`,
    timeZoneLabel: zoneParts.find((part) => part.type === 'timeZoneName')?.value ?? timeZone,
  };
}
