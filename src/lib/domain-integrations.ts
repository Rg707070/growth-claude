export interface QuickLink {
  name: string
  url: string
  icon: string
  color: string
}

export interface DomainIntegration {
  links: QuickLink[]
  widgetType?: 'sefaria' | 'spotify' | 'garmin' | 'schedule'
}

export const DOMAIN_INTEGRATIONS: Record<string, DomainIntegration> = {
  torah: {
    links: [
      { name: 'ספריא', url: 'https://www.sefaria.org', icon: '📚', color: '#F59E0B' },
    ],
    widgetType: 'sefaria',
  },
  secular: {
    links: [
      { name: 'Claude AI', url: 'https://claude.ai', icon: '🤖', color: '#8B5CF6' },
    ],
  },
  finance: {
    links: [
      { name: 'Google Sheets', url: 'https://sheets.google.com', icon: '📊', color: '#34A853' },
    ],
  },
  sports: {
    links: [
      { name: 'Garmin Connect', url: 'https://connect.garmin.com', icon: '⌚', color: '#007CC3' },
    ],
    widgetType: 'garmin',
  },
  music: {
    links: [
      { name: 'Spotify', url: 'https://open.spotify.com', icon: '🎵', color: '#1DB954' },
      { name: 'Suno', url: 'https://suno.com', icon: '🎙️', color: '#FF6B6B' },
    ],
    widgetType: 'spotify',
  },
}
