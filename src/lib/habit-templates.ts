export interface HabitTemplate {
  he: string
  en: string
}

export const HABIT_TEMPLATES: Record<string, HabitTemplate[]> = {
  family: [
    { he: 'שיחה עם ההורים', en: 'Call my parents' },
    { he: 'ארוחת ערב משפחתית', en: 'Family dinner' },
    { he: 'עזרה בבית', en: 'Help around the house' },
  ],
  friends: [
    { he: 'התקשרות לחבר', en: 'Reach out to a friend' },
    { he: 'מפגש עם חברים', en: 'Meet up with friends' },
  ],
  torah: [
    { he: 'תפילת שחרית', en: 'Morning prayer' },
    { he: '30 דק׳ לימוד גמרא', en: '30 min Gemara study' },
    { he: 'פרק תהילים', en: 'A chapter of Tehillim' },
  ],
  secular: [
    { he: '30 דק׳ קריאה', en: '30 min reading' },
    { he: 'לימוד נושא חדש', en: 'Study a new topic' },
  ],
  sports: [
    { he: 'אימון', en: 'Workout' },
    { he: '10,000 צעדים', en: '10,000 steps' },
    { he: 'מתיחות בבוקר', en: 'Morning stretches' },
  ],
  finance: [
    { he: 'מעקב הוצאות', en: 'Track expenses' },
    { he: 'הפרשה לחיסכון', en: 'Set aside savings' },
  ],
  music: [
    { he: 'תרגול נגינה', en: 'Practice playing' },
    { he: 'לימוד שיר חדש', en: 'Learn a new song' },
  ],
}
