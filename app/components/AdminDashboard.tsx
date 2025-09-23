import React, { useState, useEffect, ElementType } from 'react';
import { createBrowserClient } from '@supabase/ssr';
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
    ChevronRight,
    User,
    Cake,
    Building2,
    MessageSquare,
    Info, // ✅ ADDED: Missing import for Info icon
    Transgender
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

interface AdminStatus {
    is_admin: boolean;
    role: string | null;
}

interface ApprovalModalProps {
    application: UserApplication | null;
    isOpen: boolean;
    onClose: () => void;
    onApprove: (id: string, reason?: string) => Promise<void>;
    onReject: (id: string, reason: string) => Promise<void>;
    loading: boolean;
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
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[95vh] overflow-y-auto transform transition-all duration-300 scale-95 animate-in fade-in-0 zoom-in-95">
                <div className="p-6 border-b text-center bg-slate-50 rounded-t-xl">
                    <h3 className="text-xl font-bold text-slate-800">בחינת בקשה - {application.username}</h3>
                    <p className="text-slate-500 mt-1">מזהה בקשה: {application.id.slice(0, 8)}</p>
                </div>
                <div className="p-6">
                    <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-100 p-6 rounded-lg mb-6">
                        <div className="bg-slate-200 p-4 rounded-full">
                            <User className="w-12 h-12 text-slate-500" />
                        </div>
                        <div className="text-center sm:text-right">
                            <h4 className="text-xl font-semibold text-slate-900">{application.full_name || application.username}</h4>
                            {application.full_name && <p className="text-slate-600">@{application.username}</p>}
                            <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
                                {application.age && (
                                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                                        גיל {application.age}
                                    </span>
                                )}
                                {application.gender && (
                                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-semibold">
                                        {formatGender(application.gender)}
                                    </span>
                                )}
                                {/* ✅ FIXED: Only show birth_gender when gender is "other" */}
                                {application.gender === 'other' && application.birth_gender && (
                                    <span className="bg-yellow-100 text-orange-800 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
                                        <Transgender size={12} />
                                        <span>מגדר לידה: {formatGender(application.birth_gender)}</span>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mb-6 text-sm text-slate-700">
                        <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-slate-400 flex-shrink-0"/>
                            <div><span className="font-semibold text-black">אימייל: </span>{application.email}</div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Phone className="w-5 h-5 text-slate-400 flex-shrink-0"/>
                            <div><span className="font-semibold text-black">טלפון: </span>{application.phone || 'לא צוין'}</div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Cake className="w-5 h-5 text-slate-400 flex-shrink-0"/>
                            <div><span className="font-semibold text-black">ת. לידה: </span>{formatDate(application.date_of_birth)}</div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-slate-400 flex-shrink-0"/>
                            <div><span className="font-semibold text-black">הוגשה: </span>{formatDateTime(application.created_at)}</div>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">תוכן הבקשה</label>
                        <div className="mt-1 p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <p className="text-sm text-slate-800 whitespace-pre-wrap">{application.application_text}</p>
                        </div>
                    </div>
                    <div className="pt-6">
                        <label className="block text-sm font-semibold text-slate-700 mb-3">בחר פעולה</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button onClick={() => setAction('approve')} className={`w-full p-4 text-right rounded-lg border-2 transition-all duration-200 ${ action === 'approve' ? 'border-green-500 bg-green-50 ring-2 ring-green-200' : 'border-slate-200 hover:border-green-400' }`} >
                                <div className="flex items-center gap-4"><CheckCircle className="w-6 h-6 text-green-600" /><div><div className="font-bold text-green-800">אישור הבקשה</div><div className="text-sm text-green-700 opacity-80">המשתמש יוכל להיכנס למערכת</div></div></div>
                            </button>
                            <button onClick={() => setAction('reject')} className={`w-full p-4 text-right rounded-lg border-2 transition-all duration-200 ${ action === 'reject' ? 'border-red-500 bg-red-50 ring-2 ring-red-200' : 'border-slate-200 hover:border-red-400' }`} >
                                <div className="flex items-center gap-4"><XCircle className="w-6 h-6 text-red-600" /><div><div className="font-bold text-red-800">דחיית הבקשה</div><div className="text-sm text-red-700 opacity-80">המשתמש לא יוכל להיכנס למערכת</div></div></div>
                            </button>
                        </div>
                    </div>
                    {action && (
                        <div className="mt-4 animate-in fade-in-0 duration-500">
                            <label className="block text-sm font-medium text-slate-700">הערות {action === 'reject' ? <span className="text-red-600">(נדרש)</span> : '(אופציונלי)'}</label>
                            <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="mt-2 w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y" rows={4} placeholder={ action === 'approve' ? 'הערות נוספות (אופציונלי)...' : 'סיבת הדחייה (נדרש)...' } />
                        </div>
                    )}
                </div>
                <div className="px-6 py-4 border-t bg-slate-50 flex gap-3 rounded-b-xl">
                    <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-100 transition-colors" disabled={loading}>ביטול</button>
                    <button onClick={handleSubmit} disabled={loading || !action || (action === 'reject' && !reason.trim())} className={`flex-1 px-4 py-2.5 rounded-lg text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${ action === 'approve' ? 'bg-green-600 hover:bg-green-700' : action === 'reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-400' }`} >
                        {loading ? ( <div className="flex items-center justify-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" />מעבד...</div> ) : action === 'approve' ? 'אישור הבקשה' : action === 'reject' ? 'דחיית הבקשה' : 'בחר פעולה'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, colorClass }) => (
    <div className={`bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:-translate-y-1 transition-all duration-300`}>
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-semibold text-slate-500">{title}</p>
                <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
            </div>
            <div className={`p-3 rounded-full bg-opacity-10 ${colorClass.replace('text-', 'bg-')}`}>
                <Icon className={`w-7 h-7 ${colorClass}`} />
            </div>
        </div>
    </div>
);

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [applications, setApplications] = useState<UserApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedApplication, setSelectedApplication] = useState<UserApplication | null>(null);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [adminStatus, setAdminStatus] = useState<AdminStatus | null>(null);

    useEffect(() => {
        const checkAdminPermissions = async () => {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
              setError('נדרש להתחבר כמנהל');
              return;
            }
    
            const { data: adminStatusData, error: adminError } = await supabase
              .rpc('get_user_admin_status', { user_id_param: session.user.id });
    
            if (adminError) {
              console.error('Admin status check error:', adminError);
              setError('שגיאה בבדיקת הרשאות מנהל');
              return;
            }
    
            if (!adminStatusData?.is_admin) {
              setError('אין הרשאות מנהל - גישה מוגבלת למנהלים בלבד');
              return;
            }
    
            const { data: profile } = await supabase
              .from('profiles')
              .select('username, email, is_moderator')
              .eq('id', session.user.id)
              .single();
    
            setAdminStatus(adminStatusData);
            setCurrentUser({ ...session.user, ...profile });
            
          } catch (error) {
            console.error('Admin permission check error:', error);
            setError('שגיאה בבדיקת הרשאות');
          }
        };
        checkAdminPermissions();
    }, []);

    const loadDashboardData = async () => {
        if (!currentUser || !adminStatus?.is_admin) return;
        try {
          setLoading(true);
          setError(null);
    
          const { data: statsData, error: statsError } = await supabase
            .rpc('get_admin_dashboard_stats', { admin_id: currentUser.id });
    
          if (statsError) {
            console.error('Stats error:', statsError);
            throw new Error('שגיאה בטעינת נתוני סטטיסטיקה');
          }
          setStats(statsData);
    
          const { data: appsData, error: appsError } = await supabase
            .rpc('get_pending_applications', { admin_id: currentUser.id });
    
          if (appsError) {
            console.error('Applications error:', appsError);
            throw new Error('שגיאה בטעינת בקשות ממתינות');
          }
          console.log('Applications data received from backend:', appsData);
          setApplications(appsData || []);
    
        } catch (error: any) {
          console.error('Dashboard load error:', error);
          setError(error.message || 'שגיאה בטעינת נתוני הדשבורד');
        } finally {
          setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser && adminStatus?.is_admin) {
            loadDashboardData();
        }
    }, [currentUser, adminStatus]);

    const handleApprove = async (applicationId: string, reason?: string) => {
        if (!adminStatus?.is_admin) { 
            setError('אין הרשאות לביצוע פעולה זו'); 
            return; 
        }
        try {
          setActionLoading(true);
          const application = applications.find(app => app.id === applicationId);
          if (!application) { 
            throw new Error('בקשה לא נמצאה'); 
          }
          console.log('🔥 Calling approval API with:', { userId: application.user_id, action: 'approve', adminId: currentUser.id, notes: reason || null });
          
          const response = await fetch('/api/admin/approve-user', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ userId: application.user_id, action: 'approve', adminId: currentUser.id, notes: reason || null }),
          });
          
          const result = await response.json();
          console.log('📧 API Response:', result);
          
          if (!response.ok) { 
            throw new Error(result.error || 'שגיאה באישור המשתמש'); 
          }
          
          setApplications(prev => prev.filter(app => app.id !== applicationId));
          
          if (stats) {
            setStats({ 
              ...stats, 
              pending_applications: stats.pending_applications - 1, 
              approved_applications: stats.approved_applications + 1, 
              approval_rate: ((stats.approved_applications + 1) / (stats.approved_applications + stats.rejected_applications + 1)) * 100 
            });
          }
          
          setShowApprovalModal(false);
          setSelectedApplication(null);
          alert(result.email_sent ? 'המשתמש אושר בהצלחה ונשלח אימייל אישור!' : 'המשתמש אושר בהצלחה (בעיה בשליחת אימייל)');
          
        } catch (error: any) {
          console.error('❌ Approval error:', error);
          setError(error.message || 'שגיאה באישור המשתמש');
        } finally {
          setActionLoading(false);
        }
    };
    
    const handleReject = async (applicationId: string, reason: string) => {
        if (!adminStatus?.is_admin) { 
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
          console.log('🔥 Calling rejection API with:', { userId: application.user_id, action: 'reject', adminId: currentUser.id, notes: reason.trim() });
          
          const response = await fetch('/api/admin/approve-user', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ userId: application.user_id, action: 'reject', adminId: currentUser.id, notes: reason.trim() }),
          });
          
          const result = await response.json();
          console.log('📧 API Response:', result);
          
          if (!response.ok) { 
            throw new Error(result.error || 'שגיאה בדחיית המשתמש'); 
          }
          
          setApplications(prev => prev.filter(app => app.id !== applicationId));
          
          if (stats) {
            setStats({ 
              ...stats, 
              pending_applications: stats.pending_applications - 1, 
              rejected_applications: stats.rejected_applications + 1, 
              approval_rate: (stats.approved_applications / (stats.approved_applications + stats.rejected_applications + 1)) * 100 
            });
          }
          
          setShowApprovalModal(false);
          setSelectedApplication(null);
          alert(result.email_sent ? 'המשתמש נדחה ונשלח אימייל הודעה!' : 'המשתמש נדחה (בעיה בשליחת אימייל)');
          
        } catch (error: any) {
          console.error('❌ Rejection error:', error);
          setError(error.message || 'שגיאה בדחיית המשתמש');
        } finally {
          setActionLoading(false);
        }
    };

    const filteredApplications = applications.filter(app =>
        app.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.application_text.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (error && (error.includes('הרשאות') || error.includes('מוגבלת'))) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir="rtl">
                <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center border">
                    <Shield className="w-20 h-20 text-red-500 mx-auto mb-5" />
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">אין הרשאות גישה</h2>
                    <p className="text-slate-600 mb-6">{error}</p>
                    <div className="text-sm text-slate-500 bg-slate-100 p-3 rounded-lg">
                        <p>פאנל הניהול מוגבל למנהלים בלבד.</p>
                        <p>אם אתה מנהל, פנה למפתח המערכת.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (loading && !currentUser) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex items-center gap-3 text-slate-600">
                    <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                    <span className="text-lg font-semibold">בודק הרשאות מנהל...</span>
                </div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-slate-50" dir="rtl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <header className="mb-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">פאנל ניהול המשתמשים</h1>
                            <p className="text-slate-600 mt-1">ניהול בקשות הצטרפות וחברי הקהילה</p>
                        </div>
                        {adminStatus && (
                            <div className="mt-3 sm:mt-0 bg-green-100 text-green-800 px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                <span>{adminStatus.role === 'moderator' ? 'מנהל' : adminStatus.role}</span>
                            </div>
                        )}
                    </div>
                </header>

                {error && !error.includes('הרשאות') && !error.includes('מוגבלת') && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                            <p className="text-red-800 font-medium">{error}</p>
                        </div>
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
                
                <main className="bg-white rounded-xl shadow-sm border border-slate-200">
                    <div className="p-6 border-b border-slate-200">
                        <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
                            <h2 className="text-xl font-bold text-slate-800">בקשות ממתינות ({filteredApplications.length})</h2>
                            <button onClick={loadDashboardData} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border" disabled={loading}>
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />רענן
                            </button>
                        </div>
                        <div className="relative">
                            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input type="text" placeholder="חפש לפי שם משתמש, אימייל, או תוכן הבקשה..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pr-12 pl-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" />
                        </div>
                    </div>
                    
                    <div className="divide-y divide-slate-200">
                        {loading ? (
                            <div className="p-12 text-center">
                                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-slate-400" />
                                <p className="text-slate-600 font-semibold">טוען בקשות...</p>
                            </div>
                        ) : filteredApplications.length === 0 ? (
                            <div className="p-12 text-center">
                                <Building2 className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                                <h3 className="text-lg font-bold text-slate-800">
                                    {searchTerm ? 'לא נמצאו בקשות התואמות לחיפוש' : 'אין בקשות ממתינות'}
                                </h3>
                                <p className="text-slate-500 mt-1">
                                    {searchTerm ? 'נסה מונח חיפוש אחר.' : 'כל הבקשות טופלו, עבודה טובה!'}
                                </p>
                            </div>
                        ) : (
                            filteredApplications.map((app) => (
                                <div key={app.id} className="p-6 hover:bg-slate-50 transition-colors duration-200">
                                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-4 mb-3">
                                                <div className="bg-slate-200 p-2 rounded-full">
                                                    <User className="w-6 h-6 text-slate-500" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg text-slate-800">
                                                        {app.full_name || app.username}
                                                    </h3>
                                                    <p className="text-sm text-slate-500">@{app.username}</p>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {app.age && (
                                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                                                            גיל {app.age}
                                                        </span>
                                                    )}
                                                    {app.gender && (
                                                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-semibold">
                                                            {formatGender(app.gender)}
                                                        </span>
                                                    )}
                                                    {/* ✅ FIXED: Only show birth_gender when gender is "other" */}
                                                    {app.gender === 'other' && app.birth_gender && (
                                                        <span className="bg-yellow-100 text-orange-800 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5">
                                                            <Transgender size={12} />
                                                            מגדר לידה {formatGender(app.birth_gender)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="bg-slate-100 p-3 rounded-md mb-4 border border-slate-200">
                                                <p className="text-sm text-slate-700 line-clamp-2">
                                                    <MessageSquare className="inline-block w-4 h-4 ml-2 text-slate-500" />
                                                    {app.application_text}
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="w-4 h-4 text-slate-400" />
                                                    <span>{app.email}</span>
                                                </div>
                                                {app.phone && (
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="w-4 h-4 text-slate-400" />
                                                        <span>{app.phone}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-slate-400" />
                                                    <span>הוגשה {timeAgo(app.created_at)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0 mt-3 sm:mt-0">
                                            <button 
                                                onClick={() => { 
                                                    setSelectedApplication(app); 
                                                    setShowApprovalModal(true); 
                                                }} 
                                                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
                                            >
                                                <Eye className="w-5 h-5" />
                                                בחן
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </main>
            </div>
            
            <ApprovalModal
                application={selectedApplication}
                isOpen={showApprovalModal}
                onClose={() => { 
                    setShowApprovalModal(false); 
                    setSelectedApplication(null); 
                }}
                onApprove={handleApprove}
                onReject={handleReject}
                loading={actionLoading}
            />
        </div>
    );
};

export default AdminDashboard;