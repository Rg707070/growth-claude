import type { RoutineBreaker, RoutineBreakerFilters } from '@/types/family'

/**
 * Picks a random active item from the backlog matching the given filters.
 * Returns null when the filtered backlog is empty.
 */
export function proposeRoutineBreaker(
  items: RoutineBreaker[],
  filters: RoutineBreakerFilters = {}
): RoutineBreaker | null {
  let pool = items.filter((item) => item.status === 'backlog')

  if (filters.type) pool = pool.filter((item) => item.type === filters.type)
  if (filters.cost_tier) pool = pool.filter((item) => item.cost_tier === filters.cost_tier)

  if (pool.length === 0) return null

  return pool[Math.floor(Math.random() * pool.length)]
}
