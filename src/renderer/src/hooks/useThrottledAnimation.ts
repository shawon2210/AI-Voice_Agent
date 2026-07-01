import { useEffect, useRef } from 'react'

/**
 * Throttles a callback to run at a maximum target FPS.
 * Uses requestAnimationFrame internally and skips frames to hit the target rate.
 * Also respects the user's prefers-reduced-motion setting (disables animation when active).
 */
export function useThrottledAnimation(
  callback: (deltaTime: number) => void,
  targetFPS: number = 30,
  enabled: boolean = true
): void {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (!enabled) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (prefersReduced.matches) return

    const frameInterval = 1000 / targetFPS
    let lastTime = performance.now()
    let rafId: number

    const loop = (now: number) => {
      const delta = now - lastTime
      if (delta >= frameInterval) {
        lastTime = now - (delta % frameInterval)
        callbackRef.current(delta)
      }
      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafId)
    }
  }, [targetFPS, enabled])
}
