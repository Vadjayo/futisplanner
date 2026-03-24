// Harjoituksiin liittyvät apufunktiot — käytetään sekä Dashboardissa että sivupalkissa

// Muotoile päivämäärä suomalaiseen muotoon (esim. "21.3.2025")
export function formatDate(isoString) {
  if (!isoString) return ''
  return new Date(isoString).toLocaleDateString('fi-FI', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  })
}

// Laske harjoitteiden yhteiskesto minuutteina
export function totalDuration(drills) {
  return (drills ?? []).reduce((sum, d) => sum + (d.duration ?? 0), 0)
}
