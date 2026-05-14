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
    xp: 'XP',
    level: 'רמה',
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
    todayHabits: 'הרגלי היום',
    allDomains: 'כל התחומים',
    nextLevel: 'לרמה הבאה',
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
    xp: 'XP',
    level: 'Level',
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
    todayHabits: "Today's Habits",
    allDomains: 'All Domains',
    nextLevel: 'to next level',
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
