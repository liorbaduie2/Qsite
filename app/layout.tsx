// app/layout.tsx
import type { Metadata } from "next";
import { AuthProvider } from './components/AuthProvider';
import { ThemeProvider as CustomThemeProvider } from './components/ThemeProvider';
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "פורום הקהילה - Next.js and Supabase",
  description: "פורום קהילת המפתחים הישראלית - שאל שאלות, שתף ידע וקבל עזרה",
};

// This script runs before React to prevent theme flash.
const ThemeHydrationScript = () => {
  const script = `
    (function() {
      function getInitialTheme() {
        try {
          const storedTheme = localStorage.getItem('theme-mode');
          if (storedTheme === 'light' || storedTheme === 'dark') {
            return storedTheme;
          }
        } catch (e) { /* localStorage is not available */ }

        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          return 'dark';
        }

        return 'light'; // Default
      }

      const theme = getInitialTheme();
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      }
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <head>
        <ThemeHydrationScript />
      </head>
      <body
      >
        <AuthProvider>
          <CustomThemeProvider>
            <main>{children}</main>
            {/* You can uncomment the ThemeDebugInfo component for testing if needed */}
          </CustomThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}