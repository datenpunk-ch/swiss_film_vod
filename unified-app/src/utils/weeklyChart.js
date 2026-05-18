import { PALETTE } from "../constants.js";

export const MONTH_LABELS_DE = [
  "Jan",
  "Feb",
  "Mär",
  "Apr",
  "Mai",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Okt",
  "Nov",
  "Dez",
];

export function monthFromDateString(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr.trim());
  if (!m) return null;
  const month = Number(m[2]);
  return month >= 1 && month <= 12 ? month : null;
}

export function monthLabel(month) {
  if (month == null || month < 1 || month > 12) return "";
  return MONTH_LABELS_DE[month - 1];
}

/** Grobe Zuordnung, falls im Datensatz kein Monat hinterlegt ist. */
export function approxMonthFromCinemaWeek(week) {
  const w = Number(week);
  if (!Number.isFinite(w) || w < 1) return null;
  return Math.min(12, Math.max(1, Math.ceil((w / 52) * 12)));
}

export function mergeWeeklyProfiles(marketProfile, chProfile) {
  const market = enrichWeeklyProfile(marketProfile);
  const chByWeek = new Map(
    (chProfile ?? []).map((p) => [p.week, p.admissions ?? p.mean_admissions ?? 0])
  );
  return market.map((row) => {
    const ch = chByWeek.get(row.week);
    const chVal = ch != null && Number.isFinite(Number(ch)) ? Number(ch) : null;
    const marketVal = row.admissions;
    const ch_share =
      marketVal > 0 && chVal != null ? chVal / marketVal : chVal === 0 ? 0 : null;
    return { ...row, ch: chVal, ch_share };
  });
}

export function enrichWeeklyProfile(profile) {
  const rows = (profile ?? []).map((p) => {
    const month = p.month ?? approxMonthFromCinemaWeek(p.week);
    return {
      week: p.week,
      admissions: p.admissions ?? p.mean_admissions ?? 0,
      share: p.share ?? 0,
      month,
      monthLabel: p.month_label ?? monthLabel(month),
    };
  });

  let prevMonth = null;
  return rows.map((row, index) => {
    const monthChanged = row.month != null && row.month !== prevMonth;
    if (monthChanged) prevMonth = row.month;
    const showMonth = monthChanged && !(index === 0 && row.month === 12);
    return {
      ...row,
      label: `Kinowoche ${row.week}`,
      showMonth,
    };
  });
}

export function barFillForValue(value, min, max, low = PALETTE.sandPale, high = PALETTE.accent) {
  if (!Number.isFinite(value)) return high;
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return high;
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return lerpHex(low, high, t);
}

function lerpHex(a, b, t) {
  const parse = (hex) => {
    const n = parseInt(hex.replace("#", ""), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const bl = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}
