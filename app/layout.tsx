// app/layout.tsx
import type { Metadata } from "next";
import { AuthProvider } from "./components/AuthProvider";
import { ThemeProvider as CustomThemeProvider } from "./components/ThemeProvider";
import { GlobalMobileNav } from "./components/GlobalMobileNav";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "פטפטוּ - קהילה מצומצמת ואיכותית",
  description:
    "פורום קהילה מצומצם ואיכותי ישראלי - שאל שאלות, שתפו דעות, הכירו חברים וקבל עזרה",
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
      <body suppressHydrationWarning>
        <AuthProvider>
          <CustomThemeProvider>
            <main>{children}</main>
            <GlobalMobileNav />
            {/* You can uncomment the ThemeDebugInfo component for testing if needed */}
          </CustomThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
