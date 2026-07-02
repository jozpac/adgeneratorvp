import type { CreativeState } from '../types'
import { defaultState } from '../state/defaults'

const KEY = 'breaking-news-creative:v1'

/** Persist the full state (minus image binaries, which live only in memory). */
export function saveState(state: CreativeState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // Quota or private-mode failures are non-fatal.
  }
}

/**
 * Load persisted state, merged over defaults so newly-added fields always have
 * a value even if an older payload is present.
 */
export function loadState(): CreativeState {
  const base = defaultState()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return base
    const parsed = JSON.parse(raw) as Partial<CreativeState>
    return mergeState(base, parsed)
  } catch {
    return base
  }
}

function mergeState(base: CreativeState, patch: Partial<CreativeState>): CreativeState {
  return {
    format: patch.format ?? base.format,
    background: { ...base.background, ...patch.background },
    headline: { ...base.headline, ...patch.headline },
    badge: { ...base.badge, ...patch.badge },
    profile: { ...base.profile, ...patch.profile },
    style: { ...base.style, ...patch.style },
  }
}
