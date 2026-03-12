import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireActiveAccount } from '@/lib/account-state';

/**
 * DELETE /api/profile/[username]/comments/[commentId]
 * Delete a comment. Only the profile owner can delete.
 */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ username: string; commentId: string }> }
) {
  try {
    const { username, commentId } = await context.params;
    if (!username || !commentId) {
      return NextResponse.json({ error: 'Username and comment id required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const access = await requireActiveAccount(supabase, user.id);
    if (!access.allowed) return access.errorResponse!;

    const { data: profileRow, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.trim())
      .single();

    if (profileError || !profileRow) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (profileRow.id !== user.id) {
      return NextResponse.json({ error: 'Only the profile owner can delete comments' }, { status: 403 });
    }

    const { data: comment, error: fetchError } = await supabase
      .from('profile_comments')
      .select('id, profile_id')
      .eq('id', commentId)
      .eq('profile_id', profileRow.id)
      .single();

    if (fetchError || !comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const { error: deleteError } = await supabase
      .from('profile_comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) {
      console.error('Profile comment DELETE error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Profile comment DELETE error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
