/** Local calendar date (YYYY-MM-DD).
 *
 * `toISOString().slice(0,10)` returns the UTC date, which is the previous day
 * for any timezone ahead of UTC during the local evening/night. A hospital
 * schedule must follow the local calendar, so all date keys go through here.
 */
export function todayLocal(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function nowTimeLocal(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
