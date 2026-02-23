// components/LoginModal.tsx
'use client';

import React, { useState } from 'react';
import { useAuth } from './AuthProvider';
import AuthStatusDisplay from './AuthStatusDisplay';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ 
  isOpen, 
  onClose, 
  onSwitchToRegister 
}) => {
  const { signIn, loading, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signIn(email, password);

    // Close modal only on successful authentication
    if (!result.error && result.data.user) {
      handleClose();
    }

    // Any errors or approval issues are shown via AuthStatusDisplay
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    onClose();
  };

  const handleSwitchToRegister = () => {
    handleClose();
    onSwitchToRegister();
  };

  // Never render the login modal for an already authenticated user
  if (!isOpen || user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="w-full max-w-2xl max-h-[95vh] overflow-y-auto relative modal-scroll">
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 z-20 bg-white/90 backdrop-blur-sm rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200 group"
          style={{ direction: 'ltr' }}
        >
          <svg className="w-6 h-6 text-gray-600 group-hover:text-gray-800 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20">
          <div 
            className="text-center p-8 text-white relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)'
            }}
          >
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 translate-y-12"></div>
            </div>
            
            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-3 drop-shadow-lg">התחברות לחשבון</h2>
              <p className="text-white/90 text-lg font-medium">
                היכנס עם החשבון שלך לפלטפורמת השאלות והתשובות
              </p>
            </div>
          </div>

          <div className="p-8 bg-gradient-to-br from-gray-50/50 to-white/50" dir="rtl">
            {/* Show auth status messages prominently */}
            <AuthStatusDisplay className="mb-6" />
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  כתובת אימייל
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300/60 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-300 shadow-sm"
                  dir="ltr"
                  required
                  placeholder="הזן את האימייל שלך"
                  style={{ textAlign: 'right' }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  סיסמה
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300/60 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-300 shadow-sm"
                  dir="ltr"
                  required
                  placeholder="הזן את הסיסמה שלך"
                  style={{ textAlign: 'right' }}
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed button-gradient"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    מתחבר...
                  </div>
                ) : (
                  'התחבר לחשבון'
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300/60"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-gradient-to-br from-gray-50/50 to-white/50 text-gray-600 font-medium">
                    או
                  </span>
                </div>
              </div>
              
              <p className="mt-6 text-sm text-gray-600">
                אין לך חשבון?{' '}
                <button 
                  onClick={handleSwitchToRegister}
                  className="text-indigo-600 hover:text-indigo-700 font-bold transition-colors duration-200 hover:underline"
                >
                  הירשם כאן
                </button>
              </p>
              
              <p className="mt-2 text-xs text-gray-500">
                שכחת סיסמה?{' '}
                <button className="text-indigo-600 hover:text-indigo-700 transition-colors duration-200">
                  אפס סיסמה
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;