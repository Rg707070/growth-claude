let swReg: ServiceWorkerRegistration | null = null

export async function registerSw(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
  try {
    swReg = await navigator.serviceWorker.register('/sw.js')
  } catch {
    // SW not supported or blocked (e.g. in HTTP dev env)
  }
}

function msUntilTime(time: string): number {
  const [h, m] = time.split(':').map(Number)
  const now = new Date()
  const target = new Date()
  target.setHours(h, m, 0, 0)
  return target <= now ? -1 : target.getTime() - now.getTime()
}

async function getSw(): Promise<ServiceWorker | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null
  try {
    const reg = swReg ?? (await navigator.serviceWorker.ready)
    return reg.active
  } catch {
    return null
  }
}

export async function scheduleSwReminder(
  id: string,
  time: string,
  title: string,
  body: string,
  url = '/'
): Promise<void> {
  const delay = msUntilTime(time)
  if (delay < 0) return
  const sw = await getSw()
  if (!sw) return
  sw.postMessage({ type: 'SCHEDULE', id, delay, title, body, url, tag: id })
}

export async function clearSwReminder(id: string): Promise<void> {
  const sw = await getSw()
  if (!sw) return
  sw.postMessage({ type: 'CLEAR', id })
}

export async function syncHabitsToSw(
  reminders: Record<string, { time: string; type: string }>,
  habits: Array<{ id: string; name: string }>,
  reminderBody: string
): Promise<void> {
  for (const habit of habits) {
    const r = reminders[habit.id]
    if (!r || r.type !== 'notification') continue
    await scheduleSwReminder(
      `habit-${habit.id}`,
      r.time,
      `🔔 ${habit.name}`,
      reminderBody,
      '/dashboard'
    )
  }
}

export interface GlobalReminders {
  nightCheckin: string | null
  journal: string | null
  reading: string | null
}

const GLOBAL_KEY = 'growth-global-reminders'

export function getGlobalReminders(): GlobalReminders {
  if (typeof window === 'undefined') return { nightCheckin: null, journal: null, reading: null }
  try {
    return JSON.parse(localStorage.getItem(GLOBAL_KEY) ?? 'null') ?? {
      nightCheckin: null,
      journal: null,
      reading: null,
    }
  } catch {
    return { nightCheckin: null, journal: null, reading: null }
  }
}

export function saveGlobalReminders(r: GlobalReminders): void {
  localStorage.setItem(GLOBAL_KEY, JSON.stringify(r))
}

export async function syncGlobalRemindersToSw(reminders: GlobalReminders): Promise<void> {
  const items: Array<[keyof GlobalReminders, string, string, string]> = [
    ['nightCheckin', '🌙 GROWTH', 'זמן לעשות צ׳ק-אין לילי! 📝', '/dashboard'],
    ['journal', '📔 GROWTH', 'זמן לכתוב ביומן! ✍️', '/journal'],
    ['reading', '📚 GROWTH', 'זמן לקרוא! 📖', '/reading'],
  ]
  for (const [key, title, body, url] of items) {
    const time = reminders[key]
    if (time) {
      await scheduleSwReminder(`global-${key}`, time, title, body, url)
    } else {
      await clearSwReminder(`global-${key}`)
    }
  }
}
