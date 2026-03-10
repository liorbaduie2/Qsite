import type { TagScoreEntry } from "./tag-matching";
import type { HybridTagCandidate } from "./tag-suggestions/types";

export type TagSuggestionRegressionCase = {
  id: string;
  title: string;
  content: string;
  expectedAny: string[];
  forbiddenTop?: string[];
};

export type HybridTagSuggestionRegressionCase = {
  id: string;
  title: string;
  content: string;
  candidates: HybridTagCandidate[];
  expectedAny: string[];
  forbiddenTop?: string[];
};

export type TagAutocompleteRegressionCase = {
  id: string;
  query: string;
  catalog: TagScoreEntry[];
  expectedAny: string[];
  forbiddenAny?: string[];
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
    id: "title-drives-sleep-tag",
    title: "איך להירדם מהר",
    content: "אני לא בטוח מה לעשות עם זה",
    expectedAny: ["שינה", "חוסר שינה"],
    forbiddenTop: ["בני אדם", "בני זוג", "בגדים"],
  },
  {
    id: "anxiety-news",
    title: "אני מפחד מהמצב הביטחוני",
    content: "כל חדשות על מלחמה מקפיצות לי את החרדה",
    expectedAny: ["פחד", "מלחמה", "חדשות"],
  },
  {
    id: "sleep-broken-night",
    title: "אני קם שלוש פעמים בלילה ואין לי כוח ביום",
    content: "אין לי בעיה רפואית ידועה אבל זה נמשך כבר תקופה ואני נהיה מותש",
    expectedAny: ["חוסר שינה", "שינה", "עייפות"],
    forbiddenTop: ["כושר", "בני אדם"],
  },
];

export const HYBRID_TAG_SUGGESTION_REGRESSION_CASES: HybridTagSuggestionRegressionCase[] =
  [
    {
      id: "react-hooks-mixed-language",
      title: "איך להתחיל עם hooks ב React",
      content:
        "אני בונה קומפוננטה ראשונה ב-nextjs ולא יודע איך לנהל state בצורה נקייה",
      expectedAny: ["React", "פיתוח"],
      forbiddenTop: ["טכנולוגיה"],
      candidates: [
        {
          name: "React",
          keywords: ["react", "hooks", "nextjs", "jsx", "state"],
          useCount: 18,
          recentCount: 5,
          semanticSimilarity: 0.88,
          questionSimilarity: 0.62,
          supportingQuestions: 2,
          autocompleteSimilarity: 1.2,
          acceptedCount: 12,
          shownCount: 20,
        },
        {
          name: "פיתוח",
          keywords: ["אפליקציה", "מפתח", "קומפוננטה", "frontend"],
          useCount: 20,
          recentCount: 6,
          semanticSimilarity: 0.58,
          questionSimilarity: 0.36,
          supportingQuestions: 1,
          autocompleteSimilarity: 0.62,
          acceptedCount: 6,
          shownCount: 18,
        },
        {
          name: "טכנולוגיה",
          keywords: ["טכנולוגיה", "חדשנות", "ai"],
          useCount: 24,
          recentCount: 7,
          semanticSimilarity: 0.31,
          questionSimilarity: 0.14,
          supportingQuestions: 1,
        },
      ],
    },
    {
      id: "short-form-video-semantic",
      title: "למה סרטונים קצרים שאני מעלה לא תופסים",
      content:
        "אני מנסה כבר שבועיים לקבל חשיפה לעמוד חדש וכל סרטון נשאר בלי צפיות",
      expectedAny: ["טיקטוק", "רשתות חברתיות", "אינסטגרם"],
      forbiddenTop: ["חדשות"],
      candidates: [
        {
          name: "טיקטוק",
          keywords: ["tiktok", "ויראלי", "סרטון קצר", "חשיפה"],
          useCount: 17,
          recentCount: 7,
          semanticSimilarity: 0.71,
          questionSimilarity: 0.88,
          supportingQuestions: 3,
          acceptedCount: 16,
          shownCount: 30,
        },
        {
          name: "אינסטגרם",
          keywords: ["reels", "סטורי", "עוקבים", "פיד"],
          useCount: 13,
          recentCount: 5,
          semanticSimilarity: 0.66,
          questionSimilarity: 0.61,
          supportingQuestions: 2,
          acceptedCount: 10,
          shownCount: 25,
        },
        {
          name: "רשתות חברתיות",
          keywords: ["סושיאל", "פוסט", "חשיפה", "עוקבים"],
          useCount: 25,
          recentCount: 9,
          semanticSimilarity: 0.68,
          questionSimilarity: 0.75,
          supportingQuestions: 3,
          acceptedCount: 14,
          shownCount: 28,
          manualCount: 3,
        },
        {
          name: "חדשות",
          keywords: ["אקטואליה", "כתבה", "עדכונים"],
          useCount: 32,
          recentCount: 12,
          semanticSimilarity: 0.16,
          questionSimilarity: 0.08,
          supportingQuestions: 1,
        },
      ],
    },
    {
      id: "feedback-breaks-tie-fitness",
      title: "איך לבנות שגרת אימון למתחיל",
      content:
        "אני חוזר להתאמן ורוצה להבין עם איזה מכשירים ותרגילים להתחיל בחדר",
      expectedAny: ["חדר כושר", "אימונים"],
      candidates: [
        {
          name: "חדר כושר",
          keywords: ["מכון כושר", "משקולות", "מכשירים", "סקוואט"],
          useCount: 12,
          recentCount: 5,
          semanticSimilarity: 0.67,
          questionSimilarity: 0.74,
          supportingQuestions: 3,
          acceptedCount: 22,
          shownCount: 34,
          manualCount: 4,
        },
        {
          name: "אימונים",
          keywords: ["אימון", "חזרות", "תוכנית אימון", "כוח"],
          useCount: 18,
          recentCount: 6,
          semanticSimilarity: 0.64,
          questionSimilarity: 0.58,
          supportingQuestions: 2,
          acceptedCount: 11,
          shownCount: 26,
        },
        {
          name: "כושר",
          keywords: ["אירובי", "כוח", "אימון", "מתאמן"],
          useCount: 24,
          recentCount: 8,
          semanticSimilarity: 0.69,
          questionSimilarity: 0.42,
          supportingQuestions: 2,
          acceptedCount: 2,
          shownCount: 40,
        },
      ],
    },
    {
      id: "similar-question-sleep-learning",
      title: "אני קם שלוש פעמים בלילה ואין לי כוח ביום",
      content:
        "אין לי בעיה רפואית ידועה אבל זה נמשך כבר תקופה ואני נהיה מותש",
      expectedAny: ["חוסר שינה", "שינה", "עייפות"],
      forbiddenTop: ["בני אדם"],
      candidates: [
        {
          name: "חוסר שינה",
          keywords: ["נדודי שינה", "יקיצות", "לא ישן", "שינה גרועה"],
          useCount: 9,
          recentCount: 4,
          semanticSimilarity: 0.63,
          questionSimilarity: 0.84,
          supportingQuestions: 4,
          acceptedCount: 13,
          shownCount: 22,
        },
        {
          name: "שינה",
          keywords: ["להירדם", "לישון", "שעות שינה", "התעוררויות"],
          useCount: 11,
          recentCount: 5,
          semanticSimilarity: 0.66,
          questionSimilarity: 0.71,
          supportingQuestions: 3,
          acceptedCount: 9,
          shownCount: 18,
        },
        {
          name: "עייפות",
          keywords: ["עייף", "תשישות", "חסר אנרגיה"],
          useCount: 14,
          recentCount: 5,
          semanticSimilarity: 0.59,
          questionSimilarity: 0.63,
          supportingQuestions: 3,
          acceptedCount: 7,
          shownCount: 17,
        },
        {
          name: "בני אדם",
          keywords: ["אנשים", "אופי", "התנהגות", "חברה"],
          useCount: 50,
          recentCount: 18,
          semanticSimilarity: 0.21,
          questionSimilarity: 0.12,
          supportingQuestions: 1,
        },
      ],
    },
    {
      id: "sleep-vs-fitness-noise",
      title: "אני קם שלוש פעמים בלילה ואין לי כוח ביום",
      content:
        "אין לי בעיה רפואית ידועה אבל זה נמשך כבר תקופה ואני נהיה מותש",
      expectedAny: ["חוסר שינה", "שינה", "עייפות"],
      forbiddenTop: ["כושר"],
      candidates: [
        {
          name: "חוסר שינה",
          keywords: [
            "קם בלילה",
            "מתעורר בלילה",
            "שלוש פעמים בלילה",
            "שינה מקוטעת",
          ],
          useCount: 9,
          recentCount: 4,
          semanticSimilarity: 0.63,
          questionSimilarity: 0.79,
          supportingQuestions: 4,
          acceptedCount: 13,
          shownCount: 22,
        },
        {
          name: "שינה",
          keywords: ["לילה", "בלילה", "התעוררויות", "שינה מקוטעת"],
          useCount: 11,
          recentCount: 5,
          semanticSimilarity: 0.64,
          questionSimilarity: 0.71,
          supportingQuestions: 3,
          acceptedCount: 9,
          shownCount: 18,
        },
        {
          name: "עייפות",
          keywords: ["מותש", "מותשת", "אין לי כוח", "חסר כוח"],
          useCount: 14,
          recentCount: 5,
          semanticSimilarity: 0.57,
          questionSimilarity: 0.61,
          supportingQuestions: 3,
          acceptedCount: 7,
          shownCount: 17,
        },
        {
          name: "כושר",
          keywords: ["כוח", "אימונים", "אירובי", "משקולות"],
          useCount: 24,
          recentCount: 8,
          semanticSimilarity: 0.7,
          questionSimilarity: 0.26,
          supportingQuestions: 1,
          acceptedCount: 2,
          shownCount: 40,
        },
      ],
    },
  ];

export const TAG_AUTOCOMPLETE_REGRESSION_CASES: TagAutocompleteRegressionCase[] =
  [
    {
      id: "tik-prefix-not-politics",
      query: "טיק",
      expectedAny: ["טיקטוק"],
      forbiddenAny: ["פוליטיקה"],
      catalog: [
        {
          name: "טיקטוק",
          keywords: ["tiktok", "טיק טוק", "סרטון קצר", "ויראלי"],
          useCount: 17,
        },
        {
          name: "פוליטיקה",
          keywords: ["ממשלה", "בחירות", "כנסת", "מפלגה"],
          useCount: 24,
        },
      ],
    },
  ];
