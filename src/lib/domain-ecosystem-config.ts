export interface EcosystemCategory {
  value: string
  he: string
  en: string
  icon: string
}

export interface EcosystemGoalConfig {
  tabHe: string
  tabEn: string
  addHe: string
  addEn: string
  emptyHe: string
  emptyEn: string
  types: EcosystemCategory[]
}

export interface EcosystemConfig {
  taskCategories: EcosystemCategory[]
  goals: EcosystemGoalConfig
}

const ECOSYSTEM_CONFIGS: Record<string, EcosystemConfig> = {
  friends: {
    taskCategories: [
      { value: 'hangout', he: 'בילוי', en: 'Hangout', icon: '🤝' },
      { value: 'gift', he: 'מתנה', en: 'Gift', icon: '🎁' },
      { value: 'checkin', he: "צ'ק-אין", en: 'Check-in', icon: '💬' },
      { value: 'event', he: 'אירוע', en: 'Event', icon: '🎉' },
      { value: 'other', he: 'אחר', en: 'Other', icon: '📌' },
    ],
    goals: {
      tabHe: 'חוויות',
      tabEn: 'Experiences',
      addHe: 'הוסף חוויה',
      addEn: 'Add Experience',
      emptyHe: 'אין חוויות בתוכנית',
      emptyEn: 'No experiences planned yet',
      types: [
        { value: 'trip', he: 'טיול', en: 'Trip', icon: '🗺️' },
        { value: 'restaurant', he: 'מסעדה', en: 'Restaurant', icon: '🍽️' },
        { value: 'activity', he: 'פעילות', en: 'Activity', icon: '⚡' },
        { value: 'concert', he: 'הופעה', en: 'Concert', icon: '🎵' },
        { value: 'other', he: 'אחר', en: 'Other', icon: '✨' },
      ],
    },
  },

  secular: {
    taskCategories: [
      { value: 'study', he: 'לימוד', en: 'Study', icon: '📖' },
      { value: 'assignment', he: 'מטלה', en: 'Assignment', icon: '📝' },
      { value: 'research', he: 'מחקר', en: 'Research', icon: '🔍' },
      { value: 'reading', he: 'קריאה', en: 'Reading', icon: '📚' },
      { value: 'other', he: 'אחר', en: 'Other', icon: '📌' },
    ],
    goals: {
      tabHe: 'פרויקטים',
      tabEn: 'Projects',
      addHe: 'הוסף פרויקט',
      addEn: 'Add Project',
      emptyHe: 'אין פרויקטים פעילים',
      emptyEn: 'No active projects',
      types: [
        { value: 'course', he: 'קורס', en: 'Course', icon: '🎓' },
        { value: 'book', he: 'ספר', en: 'Book', icon: '📖' },
        { value: 'project', he: 'פרויקט', en: 'Project', icon: '💻' },
        { value: 'skill', he: 'מיומנות', en: 'Skill', icon: '🎯' },
        { value: 'other', he: 'אחר', en: 'Other', icon: '✨' },
      ],
    },
  },

  sports: {
    taskCategories: [
      { value: 'training', he: 'אימון', en: 'Training', icon: '💪' },
      { value: 'recovery', he: 'התאוששות', en: 'Recovery', icon: '🛌' },
      { value: 'equipment', he: 'ציוד', en: 'Equipment', icon: '🎽' },
      { value: 'nutrition', he: 'תזונה', en: 'Nutrition', icon: '🥗' },
      { value: 'other', he: 'אחר', en: 'Other', icon: '📌' },
    ],
    goals: {
      tabHe: 'אתגרים',
      tabEn: 'Challenges',
      addHe: 'הוסף אתגר',
      addEn: 'Add Challenge',
      emptyHe: 'אין אתגרים — קבע יעד',
      emptyEn: 'No challenges set yet',
      types: [
        { value: 'race', he: 'תחרות', en: 'Race', icon: '🏅' },
        { value: 'pr', he: 'שיא אישי', en: 'Personal Record', icon: '🏆' },
        { value: 'event', he: 'אירוע', en: 'Event', icon: '📅' },
        { value: 'challenge', he: 'אתגר', en: 'Challenge', icon: '🎯' },
        { value: 'other', he: 'אחר', en: 'Other', icon: '✨' },
      ],
    },
  },

  finance: {
    taskCategories: [
      { value: 'payment', he: 'תשלום', en: 'Payment', icon: '💸' },
      { value: 'savings', he: 'חיסכון', en: 'Savings', icon: '🏦' },
      { value: 'research', he: 'מחקר', en: 'Research', icon: '📊' },
      { value: 'budget', he: 'תקציב', en: 'Budget', icon: '📋' },
      { value: 'other', he: 'אחר', en: 'Other', icon: '📌' },
    ],
    goals: {
      tabHe: 'יעדים',
      tabEn: 'Goals',
      addHe: 'הוסף יעד',
      addEn: 'Add Goal',
      emptyHe: 'אין יעדים פיננסיים',
      emptyEn: 'No financial goals yet',
      types: [
        { value: 'savings', he: 'חיסכון', en: 'Savings Goal', icon: '🏦' },
        { value: 'investment', he: 'השקעה', en: 'Investment', icon: '📈' },
        { value: 'purchase', he: 'רכישה', en: 'Purchase', icon: '🛒' },
        { value: 'budget', he: 'תקציב', en: 'Budget', icon: '📋' },
        { value: 'other', he: 'אחר', en: 'Other', icon: '✨' },
      ],
    },
  },

  music: {
    taskCategories: [
      { value: 'practice', he: 'תרגול', en: 'Practice', icon: '🎸' },
      { value: 'theory', he: 'תיאוריה', en: 'Theory', icon: '📝' },
      { value: 'recording', he: 'הקלטה', en: 'Recording', icon: '🎙️' },
      { value: 'equipment', he: 'ציוד', en: 'Equipment', icon: '🎹' },
      { value: 'other', he: 'אחר', en: 'Other', icon: '📌' },
    ],
    goals: {
      tabHe: 'יצירות',
      tabEn: 'Creations',
      addHe: 'הוסף יצירה',
      addEn: 'Add Creation',
      emptyHe: 'אין יצירות — התחל ליצור',
      emptyEn: 'No creations yet — start creating',
      types: [
        { value: 'song', he: 'שיר', en: 'Song', icon: '🎵' },
        { value: 'performance', he: 'הופעה', en: 'Performance', icon: '🎤' },
        { value: 'recording', he: 'הקלטה', en: 'Recording', icon: '💿' },
        { value: 'skill', he: 'מיומנות', en: 'Skill', icon: '🎯' },
        { value: 'other', he: 'אחר', en: 'Other', icon: '✨' },
      ],
    },
  },
}

const FALLBACK_CONFIG: EcosystemConfig = {
  taskCategories: [
    { value: 'task', he: 'משימה', en: 'Task', icon: '📌' },
    { value: 'learning', he: 'למידה', en: 'Learning', icon: '📖' },
    { value: 'practice', he: 'תרגול', en: 'Practice', icon: '💪' },
    { value: 'planning', he: 'תכנון', en: 'Planning', icon: '📋' },
    { value: 'shopping', he: 'קניות', en: 'Shopping', icon: '🛒' },
    { value: 'other', he: 'אחר', en: 'Other', icon: '✨' },
  ],
  goals: {
    tabHe: 'יעדים',
    tabEn: 'Goals',
    addHe: 'הוסף יעד',
    addEn: 'Add Goal',
    emptyHe: 'אין יעדים — הגדר מטרה ראשונה',
    emptyEn: 'No goals yet — set your first target',
    types: [
      { value: 'milestone', he: 'אבן דרך', en: 'Milestone', icon: '🏆' },
      { value: 'habit', he: 'בניית הרגל', en: 'Build Habit', icon: '🔄' },
      { value: 'skill', he: 'מיומנות', en: 'Skill', icon: '🎯' },
      { value: 'project', he: 'פרויקט', en: 'Project', icon: '💡' },
      { value: 'other', he: 'אחר', en: 'Other', icon: '✨' },
    ],
  },
}

export function getDomainEcosystemConfig(slug: string): EcosystemConfig {
  return ECOSYSTEM_CONFIGS[slug] ?? FALLBACK_CONFIG
}

export const URGENCY_COLORS: Record<string, string> = {
  low: '#6b7280',
  normal: '#3b82f6',
  high: '#f59e0b',
  critical: '#ef4444',
}
