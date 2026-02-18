// app/components/UserManagementModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { 
  X, 
  Crown, 
  Shield, 
  ShieldCheck, 
  Wrench, 
  User as UserIcon,
  MinusCircle, 
  Ban,
  Clock,
  Save,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AdminUserView {
  id: string;
  username: string;
  full_name: string;
  email: string;
  reputation: number;
  role: string;
  role_hebrew: string;
  is_hidden: boolean;
  approval_status: string;
  status: string;
  active_suspensions: number;
  created_at: string;
}

interface UserManagementModalProps {
  user: AdminUserView | null;
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  onAction: (message: string, isError: boolean) => void;
}

const roleOptions = [
  { 
    value: 'owner', 
    label: 'בעלים', 
    icon: Crown,
    color: 'text-yellow-500',
    description: 'שליטה מלאה באתר',
    max_rep_deduction: 100,
    max_suspension: null
  },
  { 
    value: 'guardian', 
    label: 'ממונה מוסמך', 
    icon: Shield,
    color: 'text-purple-500',
    description: 'גישה מורחבת לניהול',
    max_rep_deduction: 10,
    max_suspension: null
  },
  { 
    value: 'admin', 
    label: 'שומר סף', 
    icon: ShieldCheck,
    color: 'text-blue-500',
    description: 'ניהול בסיסי',
    max_rep_deduction: 5,
    max_suspension: 24
  },
  { 
    value: 'moderator', 
    label: 'נושא כלים', 
    icon: Wrench,
    color: 'text-green-500',
    description: 'פיקוח בסיסי',
    max_rep_deduction: 0,
    max_suspension: 0
  },
  { 
    value: 'user', 
    label: 'משתמש רגיל', 
    icon: UserIcon,
    color: 'text-gray-500',
    description: 'משתמש רגיל ללא הרשאות מיוחדות',
    max_rep_deduction: 0,
    max_suspension: 0
  }
];

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  user,
  isOpen,
  onClose,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  loading: _propLoading,
  onAction
}) => {
  const [activeTab, setActiveTab] = useState<'role' | 'actions'>('role');
  const [selectedRole, setSelectedRole] = useState('user');
  const [isHiddenRole, setIsHiddenRole] = useState(false);
  const [reason, setReason] = useState('');
  const [reasonHebrew, setReasonHebrew] = useState('');
  
  // Action states
  const [suspensionHours, setSuspensionHours] = useState(24);
  const [reputationDeduction, setReputationDeduction] = useState(5);
  const [actionReason, setActionReason] = useState('');
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      setSelectedRole(user.role || 'user');
      setIsHiddenRole(user.is_hidden || false);
      setReason('');
      setReasonHebrew('');
      setActionReason('');
      setActiveTab('role');
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleGrantRole = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        onAction('נדרש להתחבר מחדש', true);
        return;
      }

      const response = await fetch('/api/admin/grant-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          targetUserId: user.id,
          newRole: selectedRole,
          reason: reason || `שינוי תפקיד ל-${roleOptions.find(r => r.value === selectedRole)?.label}`,
          reasonHebrew: reasonHebrew || `שינוי תפקיד ל-${roleOptions.find(r => r.value === selectedRole)?.label}`,
          isHidden: isHiddenRole,
          temporaryUntil: null
        })
      });

      const result = await response.json();

      if (result.success) {
        onAction(`התפקיד שונה בהצלחה ל-${roleOptions.find(r => r.value === selectedRole)?.label}`, false);
        onClose();
      } else {
        onAction(result.error || 'שגיאה בשינוי תפקיד', true);
      }
    } catch (error) {
      console.error('Grant role error:', error);
      onAction('שגיאה בשינוי תפקיד', true);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendUser = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        onAction('נדרש להתחבר מחדש', true);
        return;
      }

      const response = await fetch('/api/permissions/suspend-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          targetUserId: user.id,
          hours: suspensionHours,
          reason: actionReason || 'השעיה על ידי מנהל'
        })
      });

      const result = await response.json();

      if (response.ok) {
        onAction(`המשתמש הושעה ל-${suspensionHours} שעות`, false);
        onClose();
      } else {
        onAction(result.error || 'שגיאה בהשעיית משתמש', true);
      }
    } catch (error) {
      console.error('Suspend user error:', error);
      onAction('שגיאה בהשעיית משתמש', true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeductReputation = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        onAction('נדרש להתחבר מחדש', true);
        return;
      }

      const response = await fetch('/api/permissions/deduct-reputation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          targetUserId: user.id,
          amount: reputationDeduction,
          reason: actionReason || 'הפחתת מוניטין על ידי מנהל'
        })
      });

      const result = await response.json();

      if (response.ok) {
        onAction(`הורדו ${reputationDeduction} נקודות מוניטין`, false);
        onClose();
      } else {
        onAction(result.error || 'שגיאה בהורדת מוניטין', true);
      }
    } catch (error) {
      console.error('Deduct reputation error:', error);
      onAction('שגיאה בהורדת מוניטין', true);
    } finally {
      setLoading(false);
    }
  };

  const handlePermanentBan = async () => {
    if (!user || !confirm('האם אתה בטוח שברצונך לחסום משתמש זה לצמיתות?')) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          status: 'banned',
          approval_status: 'rejected',
          rejection_reason: actionReason || 'חסימה קבועה על ידי מנהל'
        })
        .eq('id', user.id);

      if (error) throw error;

      onAction('המשתמש נחסם לצמיתות', false);
      onClose();
    } catch (error) {
      console.error('Ban user error:', error);
      onAction('שגיאה בחסימת משתמש', true);
    } finally {
      setLoading(false);
    }
  };

  const selectedRoleData = roleOptions.find(r => r.value === selectedRole);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const IconComponent = selectedRoleData?.icon || UserIcon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" dir="rtl">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-3xl w-full mx-4 max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-l from-blue-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                ניהול משתמש - {user.username}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                תפקיד נוכחי: <span className="font-semibold">{user.role_hebrew}</span>
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('role')}
            className={`flex-1 py-4 px-6 font-semibold transition-colors ${
              activeTab === 'role'
                ? 'bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`}
          >
            שינוי תפקיד
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={`flex-1 py-4 px-6 font-semibold transition-colors ${
              activeTab === 'actions'
                ? 'bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`}
          >
            פעולות ניהול
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'role' ? (
            <div className="space-y-6">
              {/* User Info */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
  <div className="grid grid-cols-2 gap-4 text-sm">
    <div>
      <span className="text-slate-600 dark:text-slate-400">אימייל:</span>
      <p className="font-semibold text-slate-800 dark:text-slate-200">{user.email}</p>
    </div>
    <div>
      <span className="text-slate-600 dark:text-slate-400">מוניטין:</span>
      <p className="font-semibold text-slate-800 dark:text-slate-200">{user.reputation}</p>
    </div>
    {/* התנהגות ואמינות הוסרו - רק מוניטין עכשיו */}
  </div>
</div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  בחר תפקיד חדש
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {roleOptions.map((role) => {
                    const RoleIcon = role.icon;
                    return (
                      <button
                        key={role.value}
                        onClick={() => setSelectedRole(role.value)}
                        className={`p-4 rounded-lg border-2 text-right transition-all ${
                          selectedRole === role.value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <RoleIcon className={`w-6 h-6 ${role.color} flex-shrink-0`} />
                          <div className="flex-1">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {role.label}
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                              {role.description}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                              {role.max_rep_deduction > 0 && (
                                <div>ניכוי מוניטין: עד {role.max_rep_deduction}</div>
                              )}
                              {role.max_suspension !== null && role.max_suspension > 0 && (
                                <div>השעיה: עד {role.max_suspension} שעות</div>
                              )}
                              {role.max_suspension === null && role.value !== 'user' && (
                                <div>השעיה: ללא הגבלה</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hidden Role Toggle */}
              {selectedRole !== 'user' && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <button
                    onClick={() => setIsHiddenRole(!isHiddenRole)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      isHiddenRole ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        isHiddenRole ? 'right-1' : 'right-7'
                      }`}
                    />
                  </button>
                  <div className="flex items-center gap-2">
                    {isHiddenRole ? <EyeOff className="w-5 h-5 text-amber-600" /> : <Eye className="w-5 h-5 text-slate-600" />}
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      תג מוסתר (משתמשים לא יראו את תפקיד המנהל)
                    </span>
                  </div>
                </div>
              )}

              {/* Reason Fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    סיבה (אנגלית) - אופציונלי
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Role change reason..."
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    סיבה (עברית) - אופציונלי
                  </label>
                  <input
                    type="text"
                    value={reasonHebrew}
                    onChange={(e) => setReasonHebrew(e.target.value)}
                    placeholder="סיבת שינוי התפקיד..."
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleGrantRole}
                disabled={loading || selectedRole === user.role}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>מעבד...</>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    שמור שינויים
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Suspend User */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-5 h-5 text-orange-500" />
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200">השעיית משתמש</h4>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      מספר שעות
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="720"
                      value={suspensionHours}
                      onChange={(e) => setSuspensionHours(parseInt(e.target.value) || 24)}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      סיבה
                    </label>
                    <textarea
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      placeholder="סיבת ההשעיה..."
                      rows={2}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                    />
                  </div>
                  <button
                    onClick={handleSuspendUser}
                    disabled={loading}
                    className="w-full py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-400 text-white rounded-lg font-semibold transition-colors"
                  >
                    השעה משתמש
                  </button>
                </div>
              </div>

              {/* Deduct Reputation */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MinusCircle className="w-5 h-5 text-red-500" />
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200">הורדת מוניטין</h4>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      כמות נקודות (מוניטין נוכחי: {user.reputation})
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={reputationDeduction}
                      onChange={(e) => setReputationDeduction(parseInt(e.target.value) || 5)}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      סיבה
                    </label>
                    <textarea
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      placeholder="סיבת הניכוי..."
                      rows={2}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                    />
                  </div>
                  <button
                    onClick={handleDeductReputation}
                    disabled={loading}
                    className="w-full py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white rounded-lg font-semibold transition-colors"
                  >
                    הורד מוניטין
                  </button>
                </div>
              </div>

              {/* Permanent Ban */}
              <div className="border-2 border-red-300 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-900/20">
                <div className="flex items-center gap-2 mb-3">
                  <Ban className="w-5 h-5 text-red-600" />
                  <h4 className="font-semibold text-red-700 dark:text-red-400">חסימה לצמיתות</h4>
                </div>
                <div className="flex items-start gap-2 mb-3 text-sm text-red-700 dark:text-red-400">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>פעולה זו תחסום את המשתמש לצמיתות ולא ניתן לבטל אותה!</p>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      סיבת החסימה
                    </label>
                    <textarea
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      placeholder="חובה למלא סיבת חסימה..."
                      rows={2}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                    />
                  </div>
                  <button
                    onClick={handlePermanentBan}
                    disabled={loading || !actionReason.trim()}
                    className="w-full py-2 bg-red-700 hover:bg-red-800 disabled:bg-slate-400 text-white rounded-lg font-semibold transition-colors"
                  >
                    חסום לצמיתות
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-b-xl">
          <button
            onClick={onClose}
            disabled={loading}
            className="w-full py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserManagementModal;