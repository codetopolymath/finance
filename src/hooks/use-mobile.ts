import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Read synchronously on first render instead of defaulting to `undefined`
  // — avoids a flash where a component (e.g. the transaction drawer) reads
  // the wrong `isMobile` value on its very first render before the effect
  // below has ever run, which can pick the wrong Drawer `direction` and
  // animation path.
  const [isMobile, setIsMobile] = React.useState<boolean>(
    () => typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT,
  )

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
