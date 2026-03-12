import { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

type AccountState = 'active' | 'suspended' | 'blocked';

interface WriteCheckResult {
  allowed: boolean;
  accountState: AccountState | null;
  errorResponse?: NextResponse;
}

/**
 * Checks whether the user's account_state allows the requested operation.
 * By default only 'active' is allowed. Pass additional states in allowStates
 * for endpoints that blocked/suspended users may still access (e.g. appeals,
 * marking notifications as read).
 */
export async function requireActiveAccount(
  supabase: SupabaseClient,
  userId: string,
  allowStates: AccountState[] = ['active'],
): Promise<WriteCheckResult> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('account_state')
    .eq('id', userId)
    .single();

  if (!profile) {
    return {
      allowed: false,
      accountState: null,
      errorResponse: NextResponse.json(
        { error: 'פרופיל לא נמצא' },
        { status: 404 },
      ),
    };
  }

  const state = profile.account_state as AccountState;

  if (!allowStates.includes(state)) {
    const message =
      state === 'blocked'
        ? 'החשבון שלך חסום. לא ניתן לבצע פעולות.'
        : 'החשבון שלך מושעה. ניתן לצפות בתוכן בלבד.';
    return {
      allowed: false,
      accountState: state,
      errorResponse: NextResponse.json({ error: message }, { status: 403 }),
    };
  }

  return { allowed: true, accountState: state };
}
