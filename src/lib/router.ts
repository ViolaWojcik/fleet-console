import { useEffect, useState } from 'react'

export type Route =
  | { screen: 'fleet' }
  | { screen: 'turbine'; id: string }
  | { screen: 'history'; id: string }
  | { screen: 'order'; id: string }

function parse(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  if (parts[0] === 'turbine' && parts[1]) return { screen: 'turbine', id: parts[1] }
  if (parts[0] === 'history' && parts[1]) return { screen: 'history', id: parts[1] }
  if (parts[0] === 'order' && parts[1]) return { screen: 'order', id: parts[1] }
  return { screen: 'fleet' }
}

export function href(route: Route): string {
  return route.screen === 'fleet' ? '#/' : `#/${route.screen}/${route.id}`
}

export function go(route: Route) {
  window.location.hash = href(route)
}

/** Hash routes, so the prototype works as static files on Pages and every screen has a URL. */
export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parse(window.location.hash))
  useEffect(() => {
    const on = () => setRoute(parse(window.location.hash))
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}
