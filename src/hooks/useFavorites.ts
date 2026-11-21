import { useCallback, useEffect, useState } from 'react'

const KEY = 'darkdevtools:favorites'

function readFavorites(): { ids: string[]; unavailable: boolean } {
  try {
    const stored = localStorage.getItem(KEY)
    const parsed: unknown = stored ? JSON.parse(stored) : []
    return { ids: Array.isArray(parsed) ? [...new Set(parsed.filter((item): item is string => typeof item === 'string'))] : [], unavailable: false }
  } catch {
    return { ids: [], unavailable: true }
  }
}

export function useFavorites(validIds: string[]) {
  const [favorites, setFavorites] = useState<string[]>(() => readFavorites().ids.filter((id) => validIds.includes(id)))
  const [unavailable, setUnavailable] = useState(() => readFavorites().unavailable)

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== KEY && event.key !== null) return
      const next = readFavorites()
      setFavorites(next.ids.filter((id) => validIds.includes(id)))
      setUnavailable(next.unavailable)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [validIds])

  const toggle = useCallback((id: string) => {
    setFavorites((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
      try {
        localStorage.setItem(KEY, JSON.stringify(next))
        setUnavailable(false)
      } catch {
        setUnavailable(true)
      }
      return next
    })
  }, [])

  return { favorites, toggle, unavailable }
}
