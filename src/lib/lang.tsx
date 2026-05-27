'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { Language } from '@/types'

const translations = {
  he: {
    appName: 'GROWTH',
    tagline: 'הצמיחה האישית שלך',
    login: 'התחברות',
    signup: 'הרשמה',
    email: 'אימייל',
    password: 'סיסמה',
    fullName: 'שם מלא',
    loginTitle: 'ברוך הבא',
    signupTitle: 'הצטרף ל‑GROWTH',
    noAccount: 'אין לך חשבון?',
    hasAccount: 'יש לך חשבון?',
    today: 'היום',
    habits: 'הרגלים',
    domains: 'תחומים',
    streak: 'רצף',
    days: 'ימים',
    progress: 'התקדמות',
    addHabit: 'הוסף הרגל',
    complete: 'סמן כהשלמה',
    completed: 'הושלם',
    goodMorning: 'בוקר טוב',
    goodAfternoon: 'צהריים טובים',
    goodEvening: 'ערב טוב',
    goodNight: 'לילה טוב',
    noHabitsYet: 'עדיין אין הרגלים — הוסף הרגל ראשון',
    back: 'חזרה',
    myProgress: 'ההתקדמות שלי',
    settings: 'הגדרות',
    language: 'שפה',
    logout: 'התנתקות',
    habitName: 'שם ההרגל',
    save: 'שמור',
    cancel: 'ביטול',
    deleteHabit: 'מחק הרגל',
    deleteConfirm: 'בטוח?',
    todayHabits: 'הרגלי היום',
    allDomains: 'כל התחומים',
    // Torah workspace
    torahWorkspace: 'אזור קודש',
    torahHome: 'בית',
    torahLearn: 'לימוד',
    torahFeed: 'פיד',
    torahSummaries: 'סיכומים',
    torahProfile: 'פרופיל',
    continuelearning: 'המשך לימוד',
    startLearning: 'התחל שיעור',
    minutesToday: 'דקות היום',
    sessionsToday: 'שיעורים היום',
    totalHours: 'שעות סה"כ',
    totalSessions: 'שיעורים סה"כ',
    totalSummaries: 'סיכומים',
    whatLearning: 'מה אתה לומד?',
    textReference: 'מקור (למשל: ברכות ב:א)',
    addNote: 'הוסף הערה',
    addQuestion: 'הוסף שאלה',
    endSession: 'סיים שיעור',
    sessionSaved: 'שיעור נשמר',
    recentSessions: 'שיעורים אחרונים',
    noSessionsYet: 'עדיין אין שיעורים',
    newSummary: 'סיכום חדש',
    summaryTitle: 'כותרת',
    summaryContent: 'תוכן',
    summarySource: 'מקור',
    summaryFolder: 'תיקייה',
    summaryTags: 'תגיות (מופרדות בפסיקים)',
    noSummariesYet: 'עדיין אין סיכומים',
    favorites: 'מועדפים',
    allFolders: 'הכל',
    search: 'חיפוש',
    lessonFeed: 'שיעורים',
    savelesson: 'שמור',
    saved: 'נשמר',
    duration: 'משך',
    speaker: 'מגיד',
    learningStats: 'סטטיסטיקות',
    weeklyLearning: 'לימוד שבועי',
    habitPerformance: 'ביצוע הרגלים',
    gemara: 'גמרא',
    mishnah: 'משנה',
    tanakh: 'תנ"ך',
    halacha: 'הלכה',
    article: 'מאמר',
    other: 'אחר',
    min: 'דק',
    notes: 'הערות',
    questions: 'שאלות',
    sessionTimer: 'טיימר שיעור',
    running: 'רץ',
    paused: 'מושהה',
    setReminder: 'הגדר תזכורת',
    reminderNotification: 'התראה',
    reminderAlarm: 'אזעקה',
    deleteReminder: 'מחק תזכורת',
    habitReminderBody: 'זמן לבצע את ההרגל! 💪',
  },
  en: {
    appName: 'GROWTH',
    tagline: 'Your personal growth journey',
    login: 'Login',
    signup: 'Sign Up',
    email: 'Email',
    password: 'Password',
    fullName: 'Full Name',
    loginTitle: 'Welcome back',
    signupTitle: 'Join GROWTH',
    noAccount: "Don't have an account?",
    hasAccount: 'Already have an account?',
    today: 'Today',
    habits: 'Habits',
    domains: 'Domains',
    streak: 'Streak',
    days: 'days',
    progress: 'Progress',
    addHabit: 'Add Habit',
    complete: 'Mark Complete',
    completed: 'Completed',
    goodMorning: 'Good morning',
    goodAfternoon: 'Good afternoon',
    goodEvening: 'Good evening',
    goodNight: 'Good night',
    noHabitsYet: 'No habits yet — add your first habit',
    back: 'Back',
    myProgress: 'My Progress',
    settings: 'Settings',
    language: 'Language',
    logout: 'Logout',
    habitName: 'Habit name',
    save: 'Save',
    cancel: 'Cancel',
    deleteHabit: 'Delete habit',
    deleteConfirm: 'Sure?',
    todayHabits: "Today's Habits",
    allDomains: 'All Domains',
    // Torah workspace
    torahWorkspace: 'Torah Workspace',
    torahHome: 'Home',
    torahLearn: 'Learn',
    torahFeed: 'Feed',
    torahSummaries: 'Summaries',
    torahProfile: 'Profile',
    continuelearning: 'Continue Learning',
    startLearning: 'Start Session',
    minutesToday: 'Minutes Today',
    sessionsToday: 'Sessions Today',
    totalHours: 'Total Hours',
    totalSessions: 'Total Sessions',
    totalSummaries: 'Summaries',
    whatLearning: 'What are you learning?',
    textReference: 'Reference (e.g. Berakhot 2a)',
    addNote: 'Add note',
    addQuestion: 'Add question',
    endSession: 'End Session',
    sessionSaved: 'Session saved',
    recentSessions: 'Recent Sessions',
    noSessionsYet: 'No sessions yet',
    newSummary: 'New Summary',
    summaryTitle: 'Title',
    summaryContent: 'Content',
    summarySource: 'Source',
    summaryFolder: 'Folder',
    summaryTags: 'Tags (comma separated)',
    noSummariesYet: 'No summaries yet',
    favorites: 'Favorites',
    allFolders: 'All',
    search: 'Search',
    lessonFeed: 'Lessons',
    savelesson: 'Save',
    saved: 'Saved',
    duration: 'Duration',
    speaker: 'Speaker',
    learningStats: 'Statistics',
    weeklyLearning: 'Weekly Learning',
    habitPerformance: 'Habit Performance',
    gemara: 'Gemara',
    mishnah: 'Mishnah',
    tanakh: 'Tanakh',
    halacha: 'Halacha',
    article: 'Article',
    other: 'Other',
    min: 'min',
    notes: 'Notes',
    questions: 'Questions',
    sessionTimer: 'Session Timer',
    running: 'Running',
    paused: 'Paused',
    setReminder: 'Set reminder',
    reminderNotification: 'Notification',
    reminderAlarm: 'Alarm',
    deleteReminder: 'Delete reminder',
    habitReminderBody: "Time to complete your habit! 💪",
  },
}

export type TranslationKey = keyof typeof translations.he

interface LangContextType {
  lang: Language
  t: (key: TranslationKey) => string
  toggleLang: () => void
  isRTL: boolean
}

const LangContext = createContext<LangContextType>({
  lang: 'he',
  t: (key) => key,
  toggleLang: () => {},
  isRTL: true,
})

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>('he')

  useEffect(() => {
    const saved = localStorage.getItem('growth-lang') as Language | null
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is SSR-unsafe, must sync post-mount
    if (saved === 'en' || saved === 'he') setLang(saved)
  }, [])

  useEffect(() => {
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
    localStorage.setItem('growth-lang', lang)
  }, [lang])

  const toggleLang = () => setLang((prev) => (prev === 'he' ? 'en' : 'he'))
  const t = (key: TranslationKey) => translations[lang][key]
  const isRTL = lang === 'he'

  return (
    <LangContext.Provider value={{ lang, t, toggleLang, isRTL }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
