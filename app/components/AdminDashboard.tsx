//app/components/AdminDashboard.tsx
"use client";

import React, { useState, useEffect, ElementType } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useAuth } from './AuthProvider';
import { suspendUser } from '@/lib/permissions';

import {
    Users,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Search,
    Phone,
    Mail,
    Calendar,
    Eye,
    RefreshCw,
    BarChart3,
    Shield,
    User,
    Cake,
    Building2,
    Transgender,
    Ban,
    MinusCircle,
    Crown,
    ShieldCheck,
    Wrench,
    Save,
    EyeOff
} from 'lucide-react';

const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- Interfaces (Data Structures) --- //
interface DashboardStats {
    pending_applications: number;
    approved_applications: number;
    rejected_applications: number;
    total_users: number;
    approval_rate: number;
}

interface UserApplication {
    id: string;
    user_id: string;
    username: string;
    email: string;
    application_text: string;
    phone: string;
    created_at: string;
    full_name: string;
    date_of_birth: string | null;
    gender: string | null;
    age: number | null;
    birth_gender: string | null;
}

interface AdminUserView {
    id: string;
    username: string;
    full_name: string;
    email: string;
    reputation: number;
    behavior_score: number;
    credibility_score: number;
    role: string;
    role_hebrew: string;
    is_hidden: boolean;
    approval_status: string;
    status: string;
    active_suspensions: number;
    created_at: string;
}

interface PenaltyType {
    penalty_type: string;
    points_deduction: number;
    description_hebrew: string;
    min_admin_role: string;
}

interface ApprovalModalProps {
    application: UserApplication | null;
    isOpen: boolean;
    onClose: () => void;
    onApprove: (id: string, reason?: string) => Promise<void>;
    onReject: (id: string, reason: string) => Promise<void>;
    loading: boolean;
}

interface UserManagementModalProps {
    user: AdminUserView | null;
    isOpen: boolean;
    onClose: () => void;
    loading: boolean;
    onAction: (message: string, isError: boolean) => void;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ElementType;
  colorClass: string;
}

// --- Helper Functions for Formatting --- //
const timeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return `לפני ${Math.floor(interval)} שנים`;
    interval = seconds / 2592000;
    if (interval > 1) return `לפני ${Math.floor(interval)} חודשים`;
    interval = seconds / 86400;
    if (interval > 1) return `לפני ${Math.floor(interval)} ימים`;
    interval = seconds / 3600;
    if (interval > 1) return `לפני ${Math.floor(interval)} שעות`;
    interval = seconds / 60;
    if (interval > 1) return `לפני ${Math.floor(interval)} דקות`;
    return 'ממש עכשיו';
};

const formatGender = (gender: string | null): string => {
    if (!gender) return 'לא צוין';
    switch (gender.toLowerCase()) {
        case 'male': return 'זכר';
        case 'female': return 'נקבה';
        case 'other': return 'אחר';
        default: return gender;
    }
};

const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'לא צוין';
    return new Date(dateString).toLocaleDateString('he-IL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const formatDateTime = (dateString: string | null): string => {
  if (!dateString) return 'לא צוין';
  return new Date(dateString).toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// --- Sub-Components --- //

const ApprovalModal: React.FC<ApprovalModalProps> = ({
    application,
    isOpen,
    onClose,
    onApprove,
    onReject,
    loading
}) => {
    const [reason, setReason] = useState('');
    const [action, setAction] = useState<'approve' | 'reject' | null>(null);

    useEffect(() => {
        if (isOpen) {
            setReason('');
            setAction(null);
        }
    }, [isOpen]);

    if (!isOpen || !application) return null;

    const handleSubmit = () => {
        if (action === 'approve') {
            onApprove(application.id, reason || undefined);
        } else if (action === 'reject') {
            onReject(application.id, reason);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[95vh] overflow-y-auto transform transition-all duration-300 scale-95 animate-in fade-in-0 zoom-in-95">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 text-center bg-slate-50 dark:bg-slate-900/50 rounded-t-xl">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">בחינת בקשה - {application.username}</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">מזהה בקשה: {application.id.slice(0, 8)}</p>
                </div>
                <div className="p-6">
                    <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-100 dark:bg-slate-700/50 p-6 rounded-lg mb-6">
                        <div className="bg-slate-200 dark:bg-slate-600 p-4 rounded-full">
                            <User className="w-12 h-12 text-slate-500 dark:text-slate-300" />
                        </div>
                        <div className="text-center sm:text-right">
                            <h4 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{application.full_name || application.username}</h4>
                            {application.full_name && <p className="text-slate-600 dark:text-slate-400">@{application.username}</p>}
                            <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
                                {application.age && (
                                    <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 px-3 py-1 rounded-full text-xs font-semibold">
                                        גיל {application.age}
                                    </span>
                                )}
                                {application.gender && (
                                    <span className="bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200 px-3 py-1 rounded-full text-xs font-semibold">
                                        {formatGender(application.gender)}
                                    </span>
                                )}
                                {application.gender === 'other' && application.birth_gender && (
                                    <span className="bg-yellow-100 text-orange-800 dark:bg-yellow-900/50 dark:text-yellow-200 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
                                        <Transgender size={12} />
                                        <span>מגדר לידה: {formatGender(application.birth_gender)}</span>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mb-6 text-sm text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0"/>
                            <div><span className="font-semibold text-black dark:text-white">אימייל: </span>{application.email}</div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Phone className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0"/>
                            <div><span className="font-semibold text-black dark:text-white">טלפון: </span>{application.phone || 'לא צוין'}</div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Cake className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0"/>
                            <div><span className="font-semibold text-black dark:text-white">ת. לידה: </span>{formatDate(application.date_of_birth)}</div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0"/>
                            <div><span className="font-semibold text-black dark:text-white">הוגשה: </span>{formatDateTime(application.created_at)}</div>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">תוכן הבקשה</label>
                        <div className="mt-1 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                            <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{application.application_text}</p>
                        </div>
                    </div>
                    <div className="pt-6">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">בחר פעולה</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button onClick={() => setAction('approve')} className={`w-full p-4 text-right rounded-lg border-2 transition-all duration-200 ${ action === 'approve' ? 'border-green-500 bg-green-50 dark:bg-green-900/20 ring-2 ring-green-200 dark:ring-green-800/50' : 'border-slate-200 dark:border-slate-700 hover:border-green-400 dark:hover:border-green-600' }`} >
                                <div className="flex items-center gap-4"><CheckCircle className="w-6 h-6 text-green-600" /><div><div className="font-bold text-green-800 dark:text-green-300">אישור הבקשה</div><div className="text-sm text-green-700 dark:text-green-400 opacity-80">המשתמש יוכל להיכנס למערכת</div></div></div>
                            </button>
                            <button onClick={() => setAction('reject')} className={`w-full p-4 text-right rounded-lg border-2 transition-all duration-200 ${ action === 'reject' ? 'border-red-500 bg-red-50 dark:bg-red-900/20 ring-2 ring-red-200 dark:ring-red-800/50' : 'border-slate-200 dark:border-slate-700 hover:border-red-400 dark:hover:border-red-600' }`} >
                                <div className="flex items-center gap-4"><XCircle className="w-6 h-6 text-red-600" /><div><div className="font-bold text-red-800 dark:text-red-300">דחיית הבקשה</div><div className="text-sm text-red-700 dark:text-red-400 opacity-80">המשתמש לא יוכל להיכנס למערכת</div></div></div>
                            </button>
                        </div>
                    </div>
                    {action && (
                        <div className="mt-4 animate-in fade-in-0 duration-500">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">הערות {action === 'reject' ? <span className="text-red-600">(נדרש)</span> : '(אופציונלי)'}</label>
                            <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="mt-2 w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y" rows={4} placeholder={ action === 'approve' ? 'הערות נוספות (אופציונלי)...' : 'סיבת הדחייה (נדרש)...' } />
                        </div>
                    )}
                </div>
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex gap-3 rounded-b-xl">
                    <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" disabled={loading}>ביטול</button>
                    <button onClick={handleSubmit} disabled={loading || !action || (action === 'reject' && !reason.trim())} className={`flex-1 px-4 py-2.5 rounded-lg text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${ action === 'approve' ? 'bg-green-600 hover:bg-green-700' : action === 'reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-400' }`} >
                        {loading ? ( <div className="flex items-center justify-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" />מעבד...</div> ) : action === 'approve' ? 'אישור הבקשה' : action === 'reject' ? 'דחיית הבקשה' : 'בחר פעולה'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, colorClass }) => (
    <div className={`bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md hover:-translate-y-1 transition-all duration-300`}>
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{title}</p>
                <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
            </div>
            <div className={`p-3 rounded-full bg-opacity-10 ${colorClass.replace('text-', 'bg-')}`}>
                <Icon className={`w-7 h-7 ${colorClass}`} />
            </div>
        </div>
    </div>
);

const UserManagementModal: React.FC<UserManagementModalProps> = ({ user, isOpen, onClose, loading, onAction }) => {
    const { userPermissions } = useAuth();
    const [activeTab, setActiveTab] = useState<'role' | 'actions'>('role');

    // Suspension state
    const [suspensionHours, setSuspensionHours] = useState(24);
    const [suspensionReason, setSuspensionReason] = useState('');
    
    // Penalty system state
    const [penaltyTypes, setPenaltyTypes] = useState<PenaltyType[]>([]);
    const [selectedPenaltyType, setSelectedPenaltyType] = useState('');
    const [customAmount, setCustomAmount] = useState(1);
    const [penaltyReason, setPenaltyReason] = useState('');
    const [usePenaltyType, setUsePenaltyType] = useState(true);

    // Role management state
    const [selectedRole, setSelectedRole] = useState('user');
    const [roleReason, setRoleReason] = useState('');
    const [isHiddenRole, setIsHiddenRole] = useState(false);

    const roleOptions = [
        { value: 'owner', label: 'בעלים', description: 'גישה מלאה לכל הפונקציות', icon: Crown, color: 'text-yellow-500' },
        { value: 'guardian', label: 'ממונה מוסמך', description: 'גישה מורחבת, ניהול משתמשים', icon: Shield, color: 'text-purple-500' },
        { value: 'admin', label: 'שומר סף', description: 'ניהול תוכן והשעיות מוגבלות', icon: ShieldCheck, color: 'text-blue-500' },
        { value: 'moderator', label: 'נושא כלים', description: 'פיקוח בסיסי בלבד', icon: Wrench, color: 'text-green-500' },
        { value: 'user', label: 'משתמש', description: 'משתמש רגיל ללא הרשאות', icon: User, color: 'text-slate-500' }
    ];

    useEffect(() => {
        const loadPenaltyTypes = async () => {
            if (!userPermissions?.can_deduct_reputation) return;
            try {
                const { data, error } = await supabase
                    .from('penalty_types_config')
                    .select('*')
                    .eq('is_active', true)
                    .order('points_deduction');
                
                if (error) throw error;
                if (data) {
                    setPenaltyTypes(data);
                    if (data.length > 0) setSelectedPenaltyType(data[0].penalty_type);
                }
            } catch (error) {
                console.error('Error loading penalty types:', error);
            }
        };

        if (isOpen && user) {
            // Reset states on modal open
            setSelectedRole(user.role || 'user');
            setIsHiddenRole(user.is_hidden || false);
            setRoleReason('');
            setSuspensionReason('');
            setPenaltyReason('');
            setActiveTab(userPermissions?.role === 'owner' ? 'role' : 'actions');
            loadPenaltyTypes();
        }
    }, [isOpen, user, userPermissions]);

    if (!isOpen || !user) return null;

    const handleSuspend = async () => {
        if (!suspensionReason.trim()) {
            onAction('נדרש לציין סיבת השעייה', true);
            return;
        }
        try {
            await suspendUser(user.id, suspensionHours, suspensionReason);
            onAction(`המשתמש ${user.username} הושעה בהצלחה`, false);
        } catch (error: any) {
            onAction(error.message || 'שגיאה בהשעיית המשתמש', true);
        }
    };

    const handleApplyPenalty = async () => {
        if (!penaltyReason.trim()) {
            onAction('נדרש לציין סיבה לעונש', true);
            return;
        }
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('לא מחובר למערכת');

            const requestBody = usePenaltyType 
                ? { targetUserId: user.id, penaltyType: selectedPenaltyType, reason: penaltyReason, reasonHebrew: penaltyReason }
                : { targetUserId: user.id, customAmount: customAmount, reason: penaltyReason, reasonHebrew: penaltyReason };

            const response = await fetch('/api/permissions/deduct-reputation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                body: JSON.stringify(requestBody)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'שגיאה בהטלת עונש');
            
            const deductedPoints = usePenaltyType 
                ? (penaltyTypes.find(p => p.penalty_type === selectedPenaltyType)?.points_deduction || 0)
                : customAmount;
            onAction(`נוכו ${deductedPoints} נקודות מוניטין מ-${user.username}`, false);
        } catch (error: any) {
            onAction(error.message || 'שגיאה בניכוי נקודות מוניטין', true);
        }
    };

    const handleGrantRole = async () => {
        if (!roleReason.trim()) {
            onAction('נדרש לציין סיבה למתן התפקיד', true);
            return;
        }
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('לא מחובר למערכת');

            const response = await fetch('/api/admin/grant-role', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                body: JSON.stringify({ targetUserId: user.id, newRole: selectedRole, reason: roleReason, reasonHebrew: roleReason, isHidden: isHiddenRole, temporaryUntil: null })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'שגיאה במתן תפקיד');
            
            const roleName = roleOptions.find(r => r.value === selectedRole)?.label || selectedRole;
            onAction(`התפקיד "${roleName}" הוענק ל-${user.username} בהצלחה`, false);
        } catch (error: any) {
            onAction(error.message || 'שגיאה במתן תפקיד', true);
        }
    };

    const selectedPenalty = penaltyTypes.find(p => p.penalty_type === selectedPenaltyType);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300" dir="rtl">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[95vh] flex flex-col transform transition-all duration-300 scale-95 animate-in fade-in-0 zoom-in-95">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-full">
                            <User className="w-8 h-8 text-slate-500 dark:text-slate-300" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">ניהול משתמש: {user.username}</h3>
                            <p className="text-slate-500 dark:text-slate-400">{user.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                             <span className="font-semibold text-slate-700 dark:text-slate-300">{user.role_hebrew}</span>
                             <p className="text-sm text-slate-500">מוניטין: {user.reputation}</p>
                        </div>
                         <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                            <XCircle className="w-6 h-6 text-slate-500" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex-shrink-0">
                    {userPermissions?.role === 'owner' && (
                        <button onClick={() => setActiveTab('role')} className={`flex-1 py-3 px-4 font-semibold text-center transition-colors duration-200 flex items-center justify-center gap-2 ${activeTab === 'role' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 bg-white dark:bg-slate-800' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'}`}>
                            <Shield className="w-5 h-5" />
                            ניהול תפקיד
                        </button>
                    )}
                    {(userPermissions?.can_suspend_user || userPermissions?.can_deduct_reputation) && (
                         <button onClick={() => setActiveTab('actions')} className={`flex-1 py-3 px-4 font-semibold text-center transition-colors duration-200 flex items-center justify-center gap-2 ${activeTab === 'actions' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 bg-white dark:bg-slate-800' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'}`}>
                            <AlertTriangle className="w-5 h-5" />
                            פעולות משמעתיות
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto">
                    {/* Role Management Tab */}
                    {activeTab === 'role' && userPermissions?.role === 'owner' && (
                        <div className="animate-in fade-in-0 duration-500">
                            <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">בחר תפקיד חדש</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                {roleOptions.map(role => {
                                    const RoleIcon = role.icon;
                                    return (
                                        <button key={role.value} onClick={() => setSelectedRole(role.value)} className={`p-4 rounded-xl border-2 text-right transition-all duration-200 ${selectedRole === role.value ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md' : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 bg-white dark:bg-slate-800'}`}>
                                            <div className="flex items-center gap-3 mb-2">
                                                <RoleIcon className={`w-7 h-7 flex-shrink-0 ${role.color}`} />
                                                <span className="font-bold text-lg text-slate-800 dark:text-slate-100">{role.label}</span>
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">{role.description}</p>
                                        </button>
                                    );
                                })}
                            </div>

                            {selectedRole !== 'user' && (
                                <div className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg mb-6">
                                    <input type="checkbox" id="hiddenRole" checked={isHiddenRole} onChange={e => setIsHiddenRole(e.target.checked)} className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
                                    <label htmlFor="hiddenRole" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        {isHiddenRole ? <EyeOff size={16} /> : <Eye size={16} />}
                                        הסתר תג (התפקיד לא יוצג למשתמשים אחרים)
                                    </label>
                                </div>
                            )}

                            <div>
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">סיבה לשינוי <span className="text-red-500">*</span></label>
                                <textarea value={roleReason} onChange={e => setRoleReason(e.target.value)} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} placeholder="הסבר מדוע התפקיד משתנה..."></textarea>
                            </div>
                            
                            <div className="mt-6 border-t pt-5 border-slate-200 dark:border-slate-700 flex justify-end">
                                <button onClick={handleGrantRole} disabled={loading || !roleReason.trim() || user.role === selectedRole} className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                                    {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    <span>עדכון תפקיד</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Disciplinary Actions Tab */}
                    {activeTab === 'actions' && (
                        <div className="animate-in fade-in-0 duration-500 grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Suspension Card */}
                            {userPermissions?.can_suspend_user && (
                                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4">
                                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 text-lg"><Ban className="w-6 h-6 text-red-500" />השעיית משתמש</h4>
                                    <div>
                                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">משך ההשעיה (בשעות)</label>
                                        <input type="number" value={suspensionHours} onChange={e => setSuspensionHours(Number(e.target.value))} max={userPermissions.max_suspension_hours || undefined} min="1" className="mt-1 w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" />
                                        {userPermissions.max_suspension_hours && <p className="text-xs text-slate-500 mt-1">מגבלה לתפקידך: {userPermissions.max_suspension_hours} שעות</p>}
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">סיבה <span className="text-red-500">*</span></label>
                                        <textarea value={suspensionReason} onChange={e => setSuspensionReason(e.target.value)} className="mt-1 w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" rows={3}></textarea>
                                    </div>
                                    <button onClick={handleSuspend} disabled={loading || !suspensionReason.trim()} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all shadow-sm disabled:opacity-50">
                                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'השעה משתמש'}
                                    </button>
                                </div>
                            )}
                            
                            {/* Reputation Deduction Card */}
                            {userPermissions?.can_deduct_reputation && (
                                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4">
                                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 text-lg"><MinusCircle className="w-6 h-6 text-orange-500" />ניכוי מוניטין</h4>
                                    <div className="flex gap-2 bg-slate-200 dark:bg-slate-700 p-1 rounded-lg">
                                        <button onClick={() => setUsePenaltyType(true)} className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${usePenaltyType ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}>עונש מוגדר</button>
                                        <button onClick={() => setUsePenaltyType(false)} className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${!usePenaltyType ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}>ניכוי מותאם</button>
                                    </div>
                                    {usePenaltyType ? (
                                        <div>
                                            <label className="text-sm font-medium text-slate-600 dark:text-slate-400">סוג עונש</label>
                                            <select value={selectedPenaltyType} onChange={e => setSelectedPenaltyType(e.target.value)} className="mt-1 w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500">
                                                {penaltyTypes.map(p => <option key={p.penalty_type} value={p.penalty_type}>{p.description_hebrew} (-{p.points_deduction} נק')</option>)}
                                            </select>
                                            {selectedPenalty && <p className="text-xs text-slate-500 mt-1">ינוכו {selectedPenalty.points_deduction} נקודות</p>}
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="text-sm font-medium text-slate-600 dark:text-slate-400">כמות נקודות</label>
                                            <input type="number" value={customAmount} onChange={e => setCustomAmount(Number(e.target.value))} max={userPermissions.max_reputation_deduction || 0} min="1" className="mt-1 w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" />
                                            {userPermissions.max_reputation_deduction > 0 && <p className="text-xs text-slate-500 mt-1">מגבלה לתפקידך: {userPermissions.max_reputation_deduction} נק'</p>}
                                        </div>
                                    )}
                                    <div>
                                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">סיבה <span className="text-red-500">*</span></label>
                                        <textarea value={penaltyReason} onChange={e => setPenaltyReason(e.target.value)} className="mt-1 w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" rows={3} placeholder="הסבר מדוע הנקודות מנוכות..."></textarea>
                                    </div>
                                    <button onClick={handleApplyPenalty} disabled={loading || !penaltyReason.trim() || (!usePenaltyType && customAmount > (userPermissions.max_reputation_deduction || 0))} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-all shadow-sm disabled:opacity-50">
                                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'החל עונש'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Main AdminDashboard Component --- //
const AdminDashboard: React.FC = () => {
    const { user: currentUser, userPermissions } = useAuth();
    
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [applications, setApplications] = useState<UserApplication[]>([]);
    const [users, setUsers] = useState<AdminUserView[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState<'applications' | 'users'>('applications');
    
    const [searchTerm, setSearchTerm] = useState('');

    const [selectedApplication, setSelectedApplication] = useState<UserApplication | null>(null);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    
    const [selectedUser, setSelectedUser] = useState<AdminUserView | null>(null);
    const [showUserManagementModal, setShowUserManagementModal] = useState(false);

    const permissionLabels = [
        { key: 'can_approve_registrations', label: 'אישור הרשמות' },
        { key: 'can_manage_user_ranks', label: 'ניהול דרגות' },
        { key: 'can_view_user_list', label: 'צפייה ברשימת משתמשים' },
        { key: 'can_suspend_user', label: 'השעיית משתמשים' },
        { key: 'can_deduct_reputation', label: 'ניכוי מוניטין' },
        { key: 'can_edit_delete_content', label: 'עריכה/מחיקת תוכן' },
        { key: 'can_permanent_ban', label: 'הרחקה לצמיתות' },
        { key: 'can_view_private_chats', label: "צפייה בצ'אטים פרטיים" },
    ];

    const loadDashboardData = async () => {
        if (!currentUser || !userPermissions?.can_view_user_list) return;
        
        try {
            setLoading(true);
            setError(null);
    
            if (userPermissions.can_approve_registrations) {
                const { data: statsData, error: statsError } = await supabase.rpc('get_admin_dashboard_stats', { admin_id: currentUser.id });
                if (statsError) throw new Error('שגיאה בטעינת סטטיסטיקות');
                setStats(statsData);
    
                const { data: appsData, error: appsError } = await supabase.rpc('get_pending_applications', { admin_id: currentUser.id });
                if (appsError) throw new Error('שגיאה בטעינת בקשות');
                setApplications(appsData || []);
            }

            const { data: usersData, error: usersError } = await supabase.from('admin_user_overview').select('*');
            if (usersError) throw new Error('שגיאה בטעינת רשימת משתמשים');
            setUsers(usersData || []);

        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        if(userPermissions?.can_approve_registrations) {
            setActiveTab('applications');
        } else if (userPermissions?.can_view_user_list) {
            setActiveTab('users');
        }
        
        if (currentUser && userPermissions?.can_view_user_list) {
            loadDashboardData();
        }
    }, [currentUser, userPermissions]);
    
    const handleApprove = async (applicationId: string, reason?: string) => {
      if (!userPermissions?.can_approve_registrations || !currentUser) {
        setError('אין הרשאות לביצוע פעולה זו');
        return;
      }

      try {
        setActionLoading(true);
        
        const application = applications.find(app => app.id === applicationId);
        if (!application) {
          throw new Error('בקשה לא נמצאה');
        }

        const response = await fetch('/api/admin/approve-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: application.user_id,
            action: 'approve',
            adminId: currentUser.id,
            notes: reason || null
          })
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'שגיאה באישור המשתמש');
        }

        setApplications(prev => prev.filter(app => app.id !== applicationId));
        
        if (stats) {
          setStats({
            ...stats,
            pending_applications: stats.pending_applications - 1,
            approved_applications: stats.approved_applications + 1,
            approval_rate: ((stats.approved_applications + 1) / 
              (stats.approved_applications + stats.rejected_applications + 1)) * 100
          });
        }

        setShowApprovalModal(false);
        setSelectedApplication(null);
        
        alert(result.email_sent 
          ? 'המשתמש אושר בהצלחה ונשלח אימייל אישור!'
          : 'המשתמש אושר בהצלחה (בעיה בשליחת אימייל)');
        
      } catch (error: any) {
        console.error('Approval error:', error);
        setError(error.message || 'שגיאה באישור המשתמש');
      } finally {
        setActionLoading(false);
      }
    };

    const handleReject = async (applicationId: string, reason: string) => {
      if (!userPermissions?.can_approve_registrations || !currentUser) {
        setError('אין הרשאות לביצוע פעולה זו');
        return;
      }

      if (!reason.trim()) {
        setError('סיבת הדחייה נדרשת');
        return;
      }

      try {
        setActionLoading(true);
        
        const application = applications.find(app => app.id === applicationId);
        if (!application) {
          throw new Error('בקשה לא נמצאה');
        }

        const response = await fetch('/api/admin/approve-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: application.user_id,
            action: 'reject',
            adminId: currentUser.id,
            notes: reason.trim()
          })
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'שגיאה בדחיית המשתמש');
        }

        setApplications(prev => prev.filter(app => app.id !== applicationId));
        
        if (stats) {
          setStats({
            ...stats,
            pending_applications: stats.pending_applications - 1,
            rejected_applications: stats.rejected_applications + 1,
            approval_rate: (stats.approved_applications / 
              (stats.approved_applications + stats.rejected_applications + 1)) * 100
          });
        }

        setShowApprovalModal(false);
        setSelectedApplication(null);
        
        alert(result.email_sent 
          ? 'המשתמש נדחה ונשלח אימייל הודעה!'
          : 'המשתמש נדחה (בעיה בשליחת אימייל)');
        
      } catch (error: any) {
        console.error('Rejection error:', error);
        setError(error.message || 'שגיאה בדחיית המשתמש');
      } finally {
        setActionLoading(false);
      }
    };

    const handleUserAction = (message: string, isError: boolean) => {
        if(isError) {
            setError(message);
        } else {
             // You can show a success toast/message here if you like
        }
        setShowUserManagementModal(false);
        setSelectedUser(null);
        // Refresh data to show changes
        loadDashboardData();
    }

    const filteredApplications = applications.filter(app =>
        app.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!userPermissions?.can_view_user_list) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center p-4" dir="rtl">
                <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 text-center border dark:border-slate-700">
                    <Shield className="w-20 h-20 text-red-500 mx-auto mb-5" />
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">אין הרשאות גישה</h2>
                    <p className="text-slate-600 dark:text-slate-400">פאנל הניהול מוגבל לחברי צוות בלבד.</p>
                </div>
            </div>
        );
    }
    
    if (loading) {
         return (
            <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                    <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                    <span className="text-lg font-semibold">טוען פאנל ניהול...</span>
                </div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-900" dir="rtl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                 <header className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">פאנל ניהול</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">ניהול בקשות הצטרפות וחברי הקהילה</p>
                </header>

                {userPermissions && (
                    <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">הרשאות שלך</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-slate-700 dark:text-slate-300">
                                <div>
                                    <span className="font-semibold">תפקיד: </span>
                                    <span className="font-bold text-blue-600 dark:text-blue-400">{userPermissions.role_hebrew}</span>
                                    {userPermissions.is_hidden && <span className="text-xs text-slate-500 mr-2">(תג מוסתר)</span>}
                                </div>
                                <div>
                                    <span className="font-semibold">ניכוי מוניטין מקסימלי: </span>
                                    <span>{userPermissions.max_reputation_deduction}</span>
                                </div>
                                <div className="col-span-1 sm:col-span-2">
                                    <span className="font-semibold">מגבלת השעייה: </span>
                                    <span>{userPermissions.max_suspension_hours ? `${userPermissions.max_suspension_hours} שעות` : 'ללא מגבלה'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">פעולות מותרות</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                                {permissionLabels.map(p => (
                                    userPermissions[p.key as keyof typeof userPermissions] && (
                                        <div key={p.key} className="flex items-center text-green-700 dark:text-green-400">
                                            <CheckCircle className="w-4 h-4 ml-2 flex-shrink-0" />
                                            <span>{p.label}</span>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                
                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3"><AlertTriangle className="w-5 h-5 text-red-500" /><p className="text-red-800 dark:text-red-200 font-medium">{error}</p></div>
                        <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 font-bold text-2xl leading-none">&times;</button>
                    </div>
                )}

                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
                        <StatCard title="בקשות ממתינות" value={stats.pending_applications} icon={Clock} colorClass="text-orange-500" />
                        <StatCard title="מאושרים" value={stats.approved_applications} icon={CheckCircle} colorClass="text-green-500" />
                        <StatCard title="נדחו" value={stats.rejected_applications} icon={XCircle} colorClass="text-red-500" />
                        <StatCard title="סך המשתמשים" value={stats.total_users} icon={Users} colorClass="text-blue-500" />
                        <StatCard title="שיעור אישורים" value={`${stats.approval_rate.toFixed(1)}%`} icon={BarChart3} colorClass="text-purple-500" />
                    </div>
                )}
                
                <div className="mb-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center space-x-4 space-x-reverse">
                        {userPermissions?.can_approve_registrations && <button onClick={() => setActiveTab('applications')} className={`px-4 py-2 font-semibold text-sm rounded-t-lg transition-colors ${activeTab === 'applications' ? 'bg-white dark:bg-slate-800 text-blue-600' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>בקשות ממתינות ({applications.length})</button>}
                        {userPermissions?.can_view_user_list && <button onClick={() => setActiveTab('users')} className={`px-4 py-2 font-semibold text-sm rounded-t-lg transition-colors ${activeTab === 'users' ? 'bg-white dark:bg-slate-800 text-blue-600' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>ניהול משתמשים ({users.length})</button>}
                    </div>
                </div>

                <main className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                        <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                                {activeTab === 'applications' ? `בקשות ממתינות (${filteredApplications.length})` : `כל המשתמשים (${filteredUsers.length})`}
                            </h2>
                            <button onClick={loadDashboardData} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors border dark:border-slate-600" disabled={loading}>
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />רענן
                            </button>
                        </div>
                         <div className="relative">
                            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input type="text" placeholder="חיפוש לפי שם משתמש או אימייל..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pr-12 pl-4 py-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow dark:placeholder:text-slate-400" />
                        </div>
                    </div>
                    
                    {activeTab === 'applications' && (
                         <div className="divide-y divide-slate-200 dark:divide-slate-700">
                             {filteredApplications.length > 0 ? filteredApplications.map(app => (
                                <div key={app.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200 flex flex-col sm:flex-row items-start justify-between gap-4">
                                     <div className="flex-1">
                                            <div className="flex items-center gap-4 mb-3">
                                                <div className="bg-slate-200 dark:bg-slate-600 p-2 rounded-full"><User className="w-6 h-6 text-slate-500 dark:text-slate-300" /></div>
                                                <div>
                                                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{app.full_name || app.username}</h3>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">@{app.username}</p>
                                                </div>
                                            </div>
                                            <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2 mb-3">{app.application_text}</p>
                                            <div className="text-sm text-slate-600 dark:text-slate-400">הוגשה {timeAgo(app.created_at)}</div>
                                     </div>
                                      <div className="flex-shrink-0 mt-3 sm:mt-0">
                                        <button onClick={() => { setSelectedApplication(app); setShowApprovalModal(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"><Eye className="w-5 h-5" />בחן</button>
                                     </div>
                                 </div>
                            )) : <div className="p-12 text-center"><Building2 className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" /><h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">{searchTerm ? 'לא נמצאו בקשות' : 'אין בקשות ממתינות'}</h3></div>}
                         </div>
                    )}

                    {activeTab === 'users' && (
                         <div className="divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredUsers.length > 0 ? filteredUsers.map(user => (
                               <div key={user.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200 flex flex-col sm:flex-row items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-4 mb-3">
                                            <div className="bg-slate-200 dark:bg-slate-600 p-2 rounded-full"><User className="w-6 h-6 text-slate-500 dark:text-slate-300" /></div>
                                            <div>
                                                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{user.username}</h3>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.status === 'suspended' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200' : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'}`}>{user.status === 'suspended' ? 'מושעה' : 'פעיל'}</span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600 dark:text-slate-400">
                                            <div><span className="font-semibold">תפקיד:</span> {user.role_hebrew}</div>
                                            <div><span className="font-semibold">מוניטין:</span> {user.reputation}</div>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 mt-3 sm:mt-0">
                                        <button onClick={() => { setSelectedUser(user); setShowUserManagementModal(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-slate-600 text-white rounded-lg font-semibold hover:bg-slate-700 transition-all shadow-sm hover:shadow-md">ניהול</button>
                                    </div>
                               </div>
                            )) : <div className="p-12 text-center"><Users className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" /><h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">לא נמצאו משתמשים</h3></div>}
                         </div>
                    )}
                </main>
            </div>
            
            <ApprovalModal
                application={selectedApplication}
                isOpen={showApprovalModal}
                onClose={() => { setShowApprovalModal(false); setSelectedApplication(null); }}
                onApprove={handleApprove}
                onReject={handleReject}
                loading={actionLoading}
            />

            <UserManagementModal
                user={selectedUser}
                isOpen={showUserManagementModal}
                onClose={() => { setShowUserManagementModal(false); setSelectedUser(null); }}
                loading={actionLoading}
                onAction={handleUserAction}
            />
        </div>
    );
};

export default AdminDashboard;