"use client";

import React, { useState } from 'react';
import { X, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';
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
          // Handle specific error types
          if (result.error.message.includes('Email not confirmed')) {
            setError('נדרש לאמת את כתובת המייל שלך. בדוק את תיבת הדואר שלך וללחץ על הקישור לאימות.');
          } else if (result.error.message.includes('Invalid login credentials')) {
            setError('פרטי ההתחברות שגויים. בדוק את המייל והסיסמה.');
          } else {
            setError(result.error.message);
          }
        } else {
          setSuccess('התחברת בהצלחה!');
          setTimeout(() => handleClose(), 1500);
        }
      } else {
        if (!username.trim()) {
          throw new Error('שם משתמש נדרש');
        }
        if (username.length < 3) {
          throw new Error('שם המשתמש חייב להכיל לפחות 3 תווים');
        }
        
        const result = await signUp(email, password, username, fullName);
        if (result.error) {
          if (result.error.message.includes('already registered')) {
            setError('המייל כבר רשום במערכת. נסה להתחבר במקום.');
          } else {
            setError(result.error.message);
          }
        } else {
          setSuccess('הרשמה בוצעה בהצלחה! בדוק את המייל שלך לאימות החשבון.');
          // Don't close modal immediately for signup - let user read the message
        }
      }
    } catch (err: any) {
      setError(err.message || 'שגיאה לא צפויה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
          <h2 className="text-2xl font-bold text-center">
            {mode === 'login' ? 'התחברות' : 'הרשמה'}
          </h2>
          <p className="text-indigo-100 text-center mt-2">
            {mode === 'login' ? 'ברוכים השבים!' : 'הצטרפו אלינו היום'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4" dir="rtl">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              כתובת מייל
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="example@domain.com"
              />
            </div>
          </div>

          {/* Username (only for register) */}
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                שם משתמש
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="שם משתמש ייחודי"
                />
              </div>
            </div>
          )}

          {/* Full Name (only for register) */}
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                שם מלא (אופציונלי)
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="שם מלא"
              />
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              סיסמה
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="סיסמה (לפחות 6 תווים)"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
              <AlertCircle size={20} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800">
              <CheckCircle size={20} />
              <span className="text-sm">{success}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {mode === 'login' ? 'מתחבר...' : 'נרשם...'}
              </>
            ) : (
              mode === 'login' ? 'התחברות' : 'הרשמה'
            )}
          </button>

          {/* Mode Switch */}
          <div className="text-center pt-4">
            <span className="text-gray-600">
              {mode === 'login' ? 'אין לך חשבון?' : 'יש לך כבר חשבון?'}
            </span>
            <button
              type="button"
              onClick={() => handleModeSwitch(mode === 'login' ? 'register' : 'login')}
              className="text-indigo-600 hover:text-indigo-700 font-medium mr-2 transition-colors"
            >
              {mode === 'login' ? 'הרשמה' : 'התחברות'}
            </button>
          </div>

          {/* Email Confirmation Help */}
          {mode === 'login' && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>צריך לאמת את המייל?</strong><br />
                בדוק את תיבת הדואר שלך (כולל תיקיית הספאם) וללחץ על הקישור לאימות החשבון.
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}