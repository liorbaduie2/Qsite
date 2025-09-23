// components/LoginStatusMessage.tsx
import React from 'react';
import { AlertCircle, Clock, XCircle, CheckCircle, Shield, Mail, Phone } from 'lucide-react';

export interface LoginStatusMessageProps {
  status: 'pending' | 'rejected' | 'suspended' | 'approved' | 'error' | null;
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
      case 'suspended':
        return {
          icon: Shield,
          bgColor: 'bg-gray-50 border-gray-200',
          textColor: 'text-gray-800',
          iconColor: 'text-gray-600',
          title: 'החשבון הושעה',
          titleColor: 'text-gray-900'
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
    <div className={`relative p-5 rounded-lg border-2 ${config.bgColor} ${config.textColor} ${className}`}>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-3 left-3 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="סגור הודעה"
        >
          <XCircle className="w-4 h-4" />
        </button>
      )}
      
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 w-8 h-8 rounded-full ${config.bgColor} border-2 ${config.bgColor.replace('bg-', 'border-').replace('-50', '-200')} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${config.iconColor}`} />
        </div>
        
        <div className="flex-1">
          <h3 className={`font-bold text-lg mb-2 ${config.titleColor}`}>
            {config.title}
          </h3>
          <p className="text-base leading-relaxed mb-4">
            {message}
          </p>
          
          {status === 'pending' && (
            <div className="bg-amber-100 border border-amber-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <h4 className="font-semibold text-amber-900">מה עושים עכשיו?</h4>
              </div>
              <ul className="text-sm text-amber-800 space-y-2 mr-6">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>המתן לאימייל אישור מצוות הניהול</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>בדוק את תיבת הספאם ואת תיקיית הפרומושן</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>זמן האישור הממוצע: 24-48 שעות בימי עסקים</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>הקפד לבדוק את האימייל שלך באופן קבוע</span>
                </li>
              </ul>
            </div>
          )}
          
          {(status === 'rejected' || status === 'suspended') && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-blue-600" />
                <h4 className="font-semibold text-blue-900">צריך עזרה?</h4>
              </div>
              <div className="text-sm text-blue-800 space-y-2">
                <p>לפרטים נוספים ולהבהרות, צור קשר איתנו:</p>
                <div className="bg-white border border-blue-200 rounded p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3 h-3 text-blue-600" />
                    <a 
                      href="mailto:support@yoursite.com" 
                      className="font-medium text-blue-700 hover:text-blue-900 underline"
                      dir="ltr"
                    >
                      support@yoursite.com
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3 text-blue-600" />
                    <span className="font-medium text-blue-700" dir="ltr">03-1234567</span>
                  </div>
                </div>
                <p className="text-xs text-blue-600">
                  ⏰ זמני מענה: ראשון-חמישי, 09:00-17:00
                </p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-red-100 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <h4 className="font-semibold text-red-900">מה עושים?</h4>
              </div>
              <ul className="text-sm text-red-800 space-y-1 mr-6">
                <li>• רענן את הדף ונסה שוב</li>
                <li>• בדוק את חיבור האינטרנט שלך</li>
                <li>• אם הבעיה נמשכת - צור קשר עם התמיכה</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginStatusMessage;