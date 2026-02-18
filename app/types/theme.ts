// types/theme.ts
export type SimpleThemeMode = 'light' | 'dark' | 'system';

export interface SimpleUserPreferences {
  id: string;
  user_id: string;
  theme_mode: SimpleThemeMode;
  created_at: string;
  updated_at: string;
}

// Theme display names in Hebrew
export const THEME_LABELS: Record<SimpleThemeMode, string> = {
  light: 'בהיר',
  dark: 'כהה', 
  system: 'אוטומטי'
};

// Theme descriptions in Hebrew
export const THEME_DESCRIPTIONS: Record<SimpleThemeMode, string> = {
  light: 'עיצוב בהיר וקלאסי.',
  dark: 'עיצוב כהה ונוח לעיניים בלילה.',
  system: 'מתאים את עצמו אוטומטית לעיצוב המערכת שלך.'
};

// CSS classes for themes
export const THEME_CLASSES: Record<Exclude<SimpleThemeMode, 'system'>, string> = {
  light: '',
  dark: 'dark',
};