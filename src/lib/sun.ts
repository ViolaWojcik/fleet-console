// Local sunset for the site, so night mode switches when the control room actually gets dark.
// Kelmarsh, Northamptonshire. Standard NOAA approximation, good to a few minutes.
const LAT = 52.40
const LON = -0.95

function sunEvent(date: Date, rising: boolean): Date | null {
  const rad = Math.PI / 180
  const dayOfYear = Math.floor((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) -
    Date.UTC(date.getUTCFullYear(), 0, 0)) / 86400000)
  const lngHour = LON / 15
  const t = dayOfYear + ((rising ? 6 : 18) - lngHour) / 24
  const M = 0.9856 * t - 3.289
  let L = M + 1.916 * Math.sin(M * rad) + 0.020 * Math.sin(2 * M * rad) + 282.634
  L = ((L % 360) + 360) % 360
  let RA = Math.atan(0.91764 * Math.tan(L * rad)) / rad
  RA = ((RA % 360) + 360) % 360
  RA += Math.floor(L / 90) * 90 - Math.floor(RA / 90) * 90
  RA /= 15
  const sinDec = 0.39782 * Math.sin(L * rad)
  const cosDec = Math.cos(Math.asin(sinDec))
  const cosH = (Math.cos(90.833 * rad) - sinDec * Math.sin(LAT * rad)) / (cosDec * Math.cos(LAT * rad))
  if (cosH > 1 || cosH < -1) return null
  let H = rising ? 360 - Math.acos(cosH) / rad : Math.acos(cosH) / rad
  H /= 15
  const T = H + RA - 0.06571 * t - 6.622
  const UT = (((T - lngHour) % 24) + 24) % 24
  const out = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  out.setUTCMinutes(Math.round(UT * 60))
  return out
}

export function sunTimes(now = new Date()) {
  return { sunrise: sunEvent(now, true), sunset: sunEvent(now, false) }
}

export function isNight(now = new Date()): boolean {
  const { sunrise, sunset } = sunTimes(now)
  if (!sunrise || !sunset) return false
  return now < sunrise || now > sunset
}

export function hhmm(d: Date | null): string {
  if (!d) return '--:--'
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
