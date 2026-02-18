// lib/theme-service.ts
import { createBrowserClient } from '@supabase/ssr';
import type { SimpleUserPreferences, SimpleThemeMode } from '../types/theme';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export class ThemeService {
  /**
   * Fetches user preferences. If they don't exist, it creates default preferences.
   */
  static async getUserPreferences(): Promise<SimpleUserPreferences | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    let { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      const { data: createdData, error: createError } = await supabase
        .from('user_preferences')
        .insert({ user_id: user.id, theme_mode: 'system' })
        .select('*')
        .single();

      if (createError) {
        console.error('Error creating user preferences:', createError);
        return null;
      }
      return createdData;
    } else if (error) {
      console.error('Error fetching user preferences:', error);
      return null;
    }

    return data;
  }

  /**
   * CORRECTED: Updates a user's theme. The `upsert` now correctly specifies
   * the `onConflict` column to prevent duplicate key errors.
   */
  static async updateTheme(themeMode: SimpleThemeMode): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('user_preferences')
      .upsert(
        {
          user_id: user.id, // This is the value for the unique column
          theme_mode: themeMode,
          updated_at: new Date().toISOString() // Also good practice to update this
        },
        {
          onConflict: 'user_id', // This tells Supabase which column to check for conflicts
        }
      );

    if (error) {
      console.error('Error upserting theme:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  }
}