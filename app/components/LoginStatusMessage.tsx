// components/LoginStatusMessage.tsx
import React from 'react';
import { AlertCircle, Clock, XCircle, CheckCircle, Mail, Phone } from 'lucide-react';

export interface LoginStatusMessageProps {
  status:
    | 'pending'
    | 'rejected'
    | 'approved'
    | 'error'
    | null;
  message: string;
  onDismiss?: () => void;
  className?: string;
}

const LoginStatusMessage: React.FC<LoginStatusMessageProps> = ({ 
  status, 
  message, 
  onDismiss,
  className = ""
}) => {
  if (!status || !message) return null;

  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          bgColor: 'bg-amber-50 border-amber-200',
          textColor: 'text-amber-800',
          iconColor: 'text-amber-600',
          title: 'החשבון ממתין לאישור',
          titleColor: 'text-amber-900'
        };
      case 'rejected':
        return {
          icon: XCircle,
          bgColor: 'bg-red-50 border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-600',
          title: 'החשבון נדחה',
          titleColor: 'text-red-900'
        };
      case 'approved':
        return {
          icon: CheckCircle,
          bgColor: 'bg-green-50 border-green-200',
          textColor: 'text-green-800',
          iconColor: 'text-green-600',
          title: 'כניסה מאושרת',
          titleColor: 'text-green-900'
        };
      default:
        return {
          icon: AlertCircle,
          bgColor: 'bg-red-50 border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-600',
          title: 'שגיאה',
          titleColor: 'text-red-900'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`relative rounded-md border px-3 py-2.5 sm:px-3.5 sm:py-3 ${config.bgColor} ${config.textColor} ${className}`}>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-2 left-2 text-gray-400 hover:text-gray-600 transition-colors p-0.5"
          aria-label="סגור הודעה"
        >
          <XCircle className="w-3.5 h-3.5" />
        </button>
      )}
      
      <div className={`flex gap-2.5 sm:gap-3 ${status === 'error' ? 'items-center' : 'items-start'}`}>
        <div className={`flex-shrink-0 w-7 h-7 rounded-full ${config.bgColor} border ${config.bgColor.replace('bg-', 'border-').replace('-50', '-200')} flex items-center justify-center`}>
          <Icon className={`w-3.5 h-3.5 ${config.iconColor}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          {status === 'error' ? (
            <p className={`text-sm font-semibold leading-snug ${config.titleColor}`}>
              {message}
            </p>
          ) : (
            <>
              <h3 className={`font-bold text-base leading-tight mb-1 ${config.titleColor}`}>
                {config.title}
              </h3>
              <p className="text-sm leading-relaxed mb-3 last:mb-0">
                {message}
              </p>
            </>
          )}
          
          {status === 'pending' && (
            <div className="bg-amber-100 border border-amber-200 rounded-md px-2.5 py-2 space-y-2">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                <h4 className="font-semibold text-sm text-amber-900">מה עושים עכשיו?</h4>
              </div>
              <ul className="text-xs sm:text-sm text-amber-800 space-y-1 mr-4">
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>המתן לאימייל אישור מצוות הניהול</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>בדוק את תיבת הספאם ואת תיקיית הפרומושן</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>זמן האישור הממוצע: 24-48 שעות בימי עסקים</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>הקפד לבדוק את האימייל שלך באופן קבוע</span>
                </li>
              </ul>
            </div>
          )}
          
          {(status === 'rejected') && (
            <div className="bg-blue-50 border border-blue-200 rounded-md px-2.5 py-2">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Mail className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                <h4 className="font-semibold text-sm text-blue-900">צריך עזרה?</h4>
              </div>
              <div className="text-xs sm:text-sm text-blue-800 space-y-1.5">
                <p className="leading-snug">לפרטים נוספים ולהבהרות, צור קשר איתנו:</p>
                <div className="bg-white border border-blue-200 rounded px-2 py-1.5 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3 shrink-0 text-blue-600" />
                    <a 
                      href="mailto:support@yoursite.com" 
                      className="font-medium text-blue-700 hover:text-blue-900 underline"
                      dir="ltr"
                    >
                      support@yoursite.com
                    </a>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 shrink-0 text-blue-600" />
                    <span className="font-medium text-blue-700" dir="ltr">03-1234567</span>
                  </div>
                </div>
                <p className="text-[11px] sm:text-xs text-blue-600 leading-snug">
                  ⏰ זמני מענה: ראשון-חמישי, 09:00-17:00
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginStatusMessage;