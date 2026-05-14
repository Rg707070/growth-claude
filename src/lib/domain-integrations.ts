export interface QuickLink {
  name: string
  url: string
  icon: string
  color: string
}

export interface DomainIntegration {
  links: QuickLink[]
  widgetType?: 'sefaria' | 'tradingview' | 'spotify' | 'garmin' | 'schedule'
}

export const DOMAIN_INTEGRATIONS: Record<string, DomainIntegration> = {
  torah: {
    links: [
      { name: 'ספריא', url: 'https://www.sefaria.org', icon: '📚', color: '#F59E0B' },
      { name: 'Google Docs', url: 'https://docs.google.com', icon: '📝', color: '#4285F4' },
      { name: 'Google Calendar', url: 'https://calendar.google.com', icon: '📅', color: '#4285F4' },
    ],
    widgetType: 'sefaria',
  },
  secular: {
    links: [
      { name: 'Google Docs', url: 'https://docs.google.com', icon: '📝', color: '#4285F4' },
      { name: 'Claude AI', url: 'https://claude.ai', icon: '🤖', color: '#8B5CF6' },
      { name: 'Google Calendar', url: 'https://calendar.google.com', icon: '📅', color: '#4285F4' },
    ],
  },
  trading: {
    links: [
      { name: 'TradingView', url: 'https://www.tradingview.com', icon: '📈', color: '#2962FF' },
      { name: 'Google Sheets', url: 'https://sheets.google.com', icon: '📊', color: '#34A853' },
    ],
    widgetType: 'tradingview',
  },
  finance: {
    links: [
      { name: 'Google Sheets', url: 'https://sheets.google.com', icon: '📊', color: '#34A853' },
      { name: 'Google Docs', url: 'https://docs.google.com', icon: '📝', color: '#4285F4' },
    ],
  },
  sports: {
    links: [
      { name: 'Garmin Connect', url: 'https://connect.garmin.com', icon: '⌚', color: '#007CC3' },
      { name: 'Google Calendar', url: 'https://calendar.google.com', icon: '📅', color: '#4285F4' },
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
  family: {
    links: [
      { name: 'Google Calendar', url: 'https://calendar.google.com', icon: '📅', color: '#4285F4' },
      { name: 'Google Docs', url: 'https://docs.google.com', icon: '📝', color: '#4285F4' },
    ],
  },
  friends: {
    links: [
      { name: 'Google Calendar', url: 'https://calendar.google.com', icon: '📅', color: '#4285F4' },
    ],
  },
}
