// app/api/admin/approve-user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { authenticateAdmin, isAdminAuth } from '@/lib/admin-auth';
import { Resend } from 'resend';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

async function sendApprovalEmail(email: string, username: string) {
  const emailHtml = `
    <div dir="rtl" style="font-family: Arial, sans-serif; text-align: right;">
      <h2>שלום ${username},</h2>
      <p>חשבונך באתר אושר בהצלחה!</p>
      <p>כעת תוכל להתחבר ולהתחיל להשתמש בכל השירותים שלנו.</p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/login"
           style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
          התחבר עכשיו
        </a>
      </div>
      <p>תודה שהצטרפת אלינו!</p>
      <p>צוות האתר</p>
    </div>
  `;

  await getResend().emails.send({
    from: process.env.FROM_EMAIL || 'noreply@yoursite.com',
    to: [email],
    subject: 'חשבונך אושר בהצלחה!',
    html: emailHtml,
  });

  console.log(`Approval email sent to ${email} for user ${username}`);
  return true;
}

async function sendRejectionEmail(email: string, username: string, reason?: string) {
  const emailHtml = `
    <div dir="rtl" style="font-family: Arial, sans-serif; text-align: right;">
      <h2>שלום ${username},</h2>
      <p>מצטערים להודיע לך שבקשת ההרשמה שלך נדחתה.</p>
      ${reason ? `<p><strong>סיבת הדחייה:</strong> ${reason}</p>` : ''}
      <p>אם יש לך שאלות, אנא פנה אלינו במייל.</p>
      <p>צוות האתר</p>
    </div>
  `;

  await getResend().emails.send({
    from: process.env.FROM_EMAIL || 'noreply@yoursite.com',
    to: [email],
    subject: 'בקשת הרשמה נדחתה',
    html: emailHtml,
  });

  console.log(`Rejection email sent to ${email} for user ${username}`);
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getAdminClient();

    // Authenticate via Bearer token and resolve permissions
    const auth = await authenticateAdmin(request);
    if (!isAdminAuth(auth)) return auth;

    if (!auth.permissions.can_approve_registrations) {
      return NextResponse.json({
        error: 'אין הרשאה לאישור או דחיית משתמשים',
        error_code: 'FORBIDDEN'
      }, { status: 403 });
    }

    // Derive admin ID from authenticated token (ignore body's adminId)
    const adminId = auth.user.id;

    const { userId, action, notes } = await request.json();

    if (!userId || !action) {
      return NextResponse.json({
        error: 'חסרים פרמטרים נדרשים',
        error_code: 'MISSING_PARAMS'
      }, { status: 400 });
    }

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('username, full_name, email')
      .eq('id', userId)
      .single();

    if (!userProfile) {
      return NextResponse.json({
        error: 'משתמש לא נמצא',
        error_code: 'USER_NOT_FOUND'
      }, { status: 404 });
    }

    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    const userEmail = userProfile.email || authUser.user?.email;

    if (!userEmail) {
      return NextResponse.json({
        error: 'לא נמצא מייל למשתמש',
        error_code: 'NO_EMAIL'
      }, { status: 400 });
    }

    let newStatus: string;
    let emailSent = false;

    if (action === 'approve') {
      newStatus = 'approved';

      const { error: confirmError } = await supabase.auth.admin.updateUserById(userId, {
        email_confirm: true
      });

      if (confirmError) {
        console.error('Error confirming user email:', confirmError);
      }

      try {
        await sendApprovalEmail(userEmail, userProfile.username);
        emailSent = true;
      } catch (emailError) {
        console.error('Error sending approval email:', emailError);
      }

    } else if (action === 'reject') {
      newStatus = 'rejected';

      try {
        await sendRejectionEmail(userEmail, userProfile.username, notes);
        emailSent = true;
      } catch (emailError) {
        console.error('Error sending rejection email:', emailError);
      }
    } else {
      return NextResponse.json({
        error: 'פעולה לא חוקית',
        error_code: 'INVALID_ACTION'
      }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .rpc('admin_update_user_status', {
        admin_user_id: adminId,
        target_user_id: userId,
        new_status: newStatus,
        notes: notes || null
      });

    if (updateError) {
      console.error('Error updating user status:', updateError);
      return NextResponse.json({
        error: 'שגיאה בעדכון סטטוס המשתמש',
        error_code: 'UPDATE_ERROR'
      }, { status: 500 });
    }

    if (action === 'approve') {
      await supabase
        .from('profiles')
        .update({ account_state: 'active', updated_at: new Date().toISOString() })
        .eq('id', userId);
    }

    return NextResponse.json({
      success: true,
      message: action === 'approve' ? 'המשתמש אושר בהצלחה' : 'המשתמש נדחה',
      email_sent: emailSent,
      new_status: newStatus
    });

  } catch (error) {
    console.error('Admin approval error:', error);
    return NextResponse.json({
      error: 'שגיאה לא צפויה',
      error_code: 'UNEXPECTED_ERROR'
    }, { status: 500 });
  }
}
