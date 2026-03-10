import type { TagScoreEntry } from "./tag-matching";

export type TagSuggestionRegressionCase = {
  id: string;
  title: string;
  content: string;
  expectedAny: string[];
  forbiddenTop?: string[];
};

export const TAG_SUGGESTION_REGRESSION_CATALOG: TagScoreEntry[] = [
  {
    name: "שינה",
    keywords: ["להירדם", "לישון", "נדודי שינה", "שעות שינה"],
    useCount: 5,
    recentCount: 1,
  },
  {
    name: "חוסר שינה",
    keywords: ["לא ישן", "לא ישנה", "נדודי שינה", "יקיצות"],
    useCount: 3,
    recentCount: 1,
  },
  {
    name: "עייפות",
    keywords: ["עייף", "עייפה", "תשישות", "חסר אנרגיה"],
    useCount: 8,
    recentCount: 2,
  },
  {
    name: "חולשה",
    keywords: ["חלש", "חלשה", "חוסר כוח", "תשישות"],
    useCount: 10,
    recentCount: 2,
  },
  {
    name: "טיסות",
    keywords: ["טיסה", "כרטיס טיסה", "שדה תעופה", "עלייה למטוס"],
    useCount: 6,
    recentCount: 1,
  },
  {
    name: "נסיעות",
    keywords: ["טיול", "לטוס", "חופשה", "נסיעה"],
    useCount: 16,
    recentCount: 4,
  },
  {
    name: "ארצות",
    keywords: ["מדינה", "מדינות", "חול", "עולם"],
    useCount: 7,
    recentCount: 1,
  },
  {
    name: "נעליים",
    keywords: ["נעל", "נעלי ספורט", "סניקרס", "מידת נעליים"],
    useCount: 14,
    recentCount: 3,
  },
  {
    name: "אימונים",
    keywords: ["אימון", "תוכנית אימון", "אימון כוח", "חזרות"],
    useCount: 18,
    recentCount: 6,
  },
  {
    name: "חדר כושר",
    keywords: ["מכון כושר", "משקולות", "סקוואט", "מכשירים"],
    useCount: 12,
    recentCount: 5,
  },
  {
    name: "כושר",
    keywords: ["אירובי", "כוח", "אימון", "מתאמן"],
    useCount: 24,
    recentCount: 8,
  },
  {
    name: "דיאטה",
    keywords: ["חיטוב", "ירידה במשקל", "גרעון קלורי", "תפריט"],
    useCount: 15,
    recentCount: 4,
  },
  {
    name: "תזונה",
    keywords: ["קלוריות", "לאכול", "אכילה", "ערכים תזונתיים"],
    useCount: 21,
    recentCount: 6,
  },
  {
    name: "אוכל",
    keywords: ["ארוחה", "מאכל", "אוכל", "תפריט"],
    useCount: 28,
    recentCount: 10,
  },
  {
    name: "יוטיוב",
    keywords: ["youtube", "ערוץ", "שורטס", "סרטון"],
    useCount: 11,
    recentCount: 3,
  },
  {
    name: "טיקטוק",
    keywords: ["tiktok", "טיק טוק", "רילס", "סרטון קצר"],
    useCount: 17,
    recentCount: 7,
  },
  {
    name: "אינסטגרם",
    keywords: ["instagram", "רילס", "סטורי", "פיד"],
    useCount: 13,
    recentCount: 5,
  },
  {
    name: "רשתות חברתיות",
    keywords: ["סושיאל", "פוסט", "עוקבים", "חשיפה"],
    useCount: 25,
    recentCount: 9,
  },
  {
    name: "פחד",
    keywords: ["פוחד", "חרדה", "חשש", "פאניקה"],
    useCount: 9,
    recentCount: 2,
  },
  {
    name: "מלחמה",
    keywords: ["ביטחון", "אזעקה", "צבא", "חזית"],
    useCount: 20,
    recentCount: 9,
  },
  {
    name: "חדשות",
    keywords: ["אקטואליה", "כתבה", "מבזק", "דיווח"],
    useCount: 32,
    recentCount: 12,
  },
  {
    name: "בני אדם",
    keywords: ["אנשים", "אופי", "התנהגות", "חברה"],
    useCount: 50,
    recentCount: 18,
  },
  {
    name: "בני זוג",
    keywords: ["בן זוג", "בת זוג", "זוג", "מערכת יחסים"],
    useCount: 40,
    recentCount: 14,
  },
  {
    name: "בגדים",
    keywords: ["בגד", "חולצה", "מכנסיים", "מידה"],
    useCount: 33,
    recentCount: 11,
  },
];

export const TAG_SUGGESTION_REGRESSION_CASES: TagSuggestionRegressionCase[] = [
  {
    id: "sleep-fall-asleep",
    title: "איך להירדם?",
    content: "למה אני לא מצליח להירדם בלילה כבר כמה ימים",
    expectedAny: ["שינה", "חוסר שינה", "עייפות"],
    forbiddenTop: ["בני אדם", "בני זוג", "בגדים", "נעליים"],
  },
  {
    id: "sleep-exhausted",
    title: "אני עייף כל היום",
    content: "אין לי אנרגיה ואני מרגיש תשישות מהרגע שאני קם",
    expectedAny: ["עייפות", "חולשה", "שינה"],
  },
  {
    id: "fitness-gym",
    title: "איך להתחיל בחדר כושר",
    content: "אני חדש במכון ולא יודע איך לבנות תוכנית אימון",
    expectedAny: ["חדר כושר", "אימונים", "כושר"],
  },
  {
    id: "nutrition-cut",
    title: "מה לאכול בחיטוב",
    content: "אני רוצה תפריט עם גרעון קלורי בלי להיות רעב כל היום",
    expectedAny: ["דיאטה", "תזונה", "אוכל"],
  },
  {
    id: "travel-flights",
    title: "יש טיסות זולות ליוון",
    content: "מחפש כרטיס טיסה לקיץ ולא יודע מתי להזמין",
    expectedAny: ["טיסות", "נסיעות", "ארצות"],
  },
  {
    id: "social-video",
    title: "איפה לפרסם סרטון חדש",
    content: "אני רוצה להעלות סרטון קצר ולקבל יותר חשיפה",
    expectedAny: ["טיקטוק", "יוטיוב", "אינסטגרם", "רשתות חברתיות"],
  },
  {
    id: "anxiety-news",
    title: "אני מפחד מהמצב הביטחוני",
    content: "כל חדשות על מלחמה מקפיצות לי את החרדה",
    expectedAny: ["פחד", "מלחמה", "חדשות"],
  },
];
