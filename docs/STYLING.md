# Styling & Dark Mode

This document describes the design system used across the app so new pages and components stay consistent with dark mode and layout.

## Theme

- Dark mode is driven by the **custom ThemeProvider** which toggles the `dark` class on `<html>`.
- Tailwind is configured with `darkMode: ["class"]`.
- A hydration script in the root layout prevents theme flash on load.

## Standard class patterns

Use these patterns for new pages and components so light/dark mode and layout stay consistent.

### Page background

- **Preferred:** `min-h-screen bg-slate-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100`
- Alternative (used on some auth/profile): `min-h-screen bg-gray-50 dark:bg-gray-900`

Use one of these on the root wrapper of every page.

### Cards / surfaces

- **Card/surface:** `bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50`
- **Simpler card:** `bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl`

### Text

- **Primary:** `text-gray-800 dark:text-gray-100`
- **Secondary:** `text-gray-600 dark:text-gray-300`
- **Muted:** `text-gray-500 dark:text-gray-400`

### Inputs

- **Input/textarea:** `bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400`
- **Select:** Same as input, with `text-gray-800 dark:text-gray-200` for the value.

### Header / nav

- **Nav header:** `bg-white/80 dark:bg-gray-800/90 backdrop-blur-xl border-b border-gray-200/20 dark:border-gray-700/50`
- **Menu button hover:** `hover:bg-gray-100/60 dark:hover:bg-gray-700/60`

### Drawer / modal panel

- **Panel:** `bg-white dark:bg-gray-900` (drawer) or `bg-white dark:bg-gray-800` (modals)
- **Dividers:** `border-gray-200 dark:border-gray-700`

### Buttons

- **Primary (gradient):** `bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700` (works in both themes)
- **Secondary:** `bg-white dark:bg-gray-700 text-indigo-800 dark:text-indigo-200 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600`
- **Destructive (e.g. logout):** `text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30`

### Alerts / badges

- **Error:** `bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300`
- **Success:** `bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700`
- **Info:** `bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800`

### Modals / overlays

- **Backdrop:** `bg-black/40 dark:bg-black/60` or `bg-black/50 dark:bg-black/60`
- **Modal content:** Use card/surface styles above and ensure all text and inputs inside have dark variants.

## Semantic tokens (globals.css)

The app also defines CSS variables in `:root` and `.dark` for `--background`, `--foreground`, `--card`, `--border`, etc. Components like the shared `Card` use `bg-card` and `text-card-foreground`, so they follow the theme automatically. Prefer semantic tokens when using those components; for ad-hoc layout use the Tailwind patterns above with explicit `dark:` variants.

## Checklist for new pages

1. Add a root wrapper with a page background class (see Page background).
2. Use the card/surface and text patterns for all containers and copy.
3. Add `dark:` variants to every `bg-*`, `text-*`, and `border-*` used for layout and content.
4. Test with theme toggle (Settings or system preference) to ensure no light-only or dark-only elements.
