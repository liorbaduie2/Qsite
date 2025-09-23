// components/AuthModal.tsx - UPDATED
"use client";

import React, { useState } from 'react';
import { X, Mail, Lock, User, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from './AuthProvider';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { signIn, signUp } = useAuth();

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setUsername('');
    setFullName('');
    setError('');
    setSuccess('');
  };

  const handleModeSwitch = (newMode: 'login' | 'register') => {
    setMode(newMode);
    resetForm();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'login') {
        const result = await signIn(email, password);
        if (result.error) {
          throw new Error(result.error.message);
        }
        setSuccess('התחברת בהצלחה!');
        setTimeout(() => handleClose(), 1500);
      } else {
        if (!username.trim()) {
          throw new Error('שם משתמש נדרש');
        }
        if (username.length < 3) {
          throw new Error('שם המשתמש חייב להכיל לפחות 3 תווים');
        }
        
        const result = await signUp(email, password, username, fullName);
        if (result.error) {
          throw new Error(result.error.message);
        }
        
        // 🔥 UPDATED: New admin approval success message
        setSuccess('הרשמה בוצעה בהצלחה! בקשתך ממתינה לאישור מנהל. תקבל אימייל כשהחשבון יאושר.');
        setTimeout(() => handleClose(), 3000); // Longer timeout for reading
      }
    } catch (error: any) {
      setError(error.message || 'שגיאה לא צפויה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <button
            onClick={handleClose}
            className="absolute left-4 top-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
          <div className="text-center">
            <h2 className="text-2xl font-bold">
              {mode === 'login' ? 'התחברות' : 'הרשמה חדשה'}
            </h2>
            <p className="text-indigo-100 mt-1">
              {mode === 'login' ? 'ברוכים השבים!' : 'הצטרפו אלינו'}
            </p>
          </div>
        </div>

        <div className="p-6">
          {/* Mode Switch */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button
              onClick={() => handleModeSwitch('login')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                mode === 'login'
                  ? 'bg-white text-indigo-600 shadow-md'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              התחברות
            </button>
            <button
              onClick={() => handleModeSwitch('register')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                mode === 'register'
                  ? 'bg-white text-indigo-600 shadow-md'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              הרשמה
            </button>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 text-red-700 rounded-xl mb-4">
              <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-3 p-4 bg-green-50 text-green-700 rounded-xl mb-4">
              {mode === 'register' ? (
                <Clock size={20} className="mt-0.5 flex-shrink-0" />
              ) : (
                <CheckCircle size={20} className="mt-0.5 flex-shrink-0" />
              )}
              <div className="text-sm">
                <div className="font-medium mb-1">
                  {mode === 'register' ? 'בקשה נשלחה בהצלחה!' : 'התחברת בהצלחה!'}
                </div>
                {mode === 'register' && (
                  <div className="text-green-600">
                    {success}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username (Register only) */}
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  שם משתמש *
                </label>
                <div className="relative">
                  <User size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="שם המשתמש שלך"
                    required
                  />
                </div>
              </div>
            )}

            {/* Full Name (Register only) */}
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  שם מלא (אופציונלי)
                </label>
                <div className="relative">
                  <User size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="השם המלא שלך"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                כתובת מייל *
              </label>
              <div className="relative">
                <Mail size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                סיסמה *
              </label>
              <div className="relative">
                <Lock size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder={mode === 'register' ? 'לפחות 8 תווים' : 'הסיסמה שלך'}
                  required
                />
              </div>
            </div>

            {/* Admin Approval Notice (Register only) */}
            {mode === 'register' && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Clock size={20} className="text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-700">
                    <div className="font-medium mb-1">תהליך האישור</div>
                    <div className="text-blue-600">
                      לאחר ההרשמה, הבקשה שלך תישלח לבדיקת מנהל. 
                      תקבל אימייל כאשר החשבון יאושר ותוכל להתחבר.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-4 rounded-xl transition-all transform hover:scale-105 disabled:scale-100 shadow-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {mode === 'login' ? 'מתחבר...' : 'נרשם...'}
                </div>
              ) : (
                mode === 'login' ? 'התחבר' : 'הירשם'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-500">
            {mode === 'login' ? (
              <>
                אין לך חשבון?{' '}
                <button
                  onClick={() => handleModeSwitch('register')}
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  הירשם כאן
                </button>
              </>
            ) : (
              <>
                יש לך חשבון?{' '}
                <button
                  onClick={() => handleModeSwitch('login')}
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  התחבר כאן
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}