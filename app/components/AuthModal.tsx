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
        await signIn(email, password);
        setSuccess('התחברת בהצלחה!');
        setTimeout(() => handleClose(), 1500);
      } else {
        if (!username.trim()) {
          throw new Error('שם משתמש נדרש');
        }
        if (username.length < 3) {
          throw new Error('שם המשתמש חייב להכיל לפחות 3 תווים');
        }
        
        await signUp(email, password, username, fullName);
        setSuccess('הרשמה בוצעה בהצלחה! בדוק את המייל שלך לאימות.');
        setTimeout(() => handleClose(), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'אירעה שגיאה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999999] flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden relative"
        style={{
          animation: 'modalSlideIn 0.3s ease-out'
        }}
      >
        {/* Header */}
        <div 
          className="p-6 text-white relative"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)'
          }}
        >
          <button
            onClick={handleClose}
            className="absolute top-4 left-4 p-2 rounded-lg hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">
              {mode === 'login' ? 'התחברות' : 'הרשמה'}
            </h2>
            <p className="text-white/80">
              {mode === 'login' 
                ? 'התחבר לחשבון שלך כדי להמשיך' 
                : 'צור חשבון חדש כדי להצטרף לקהילה'
              }
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Mode Toggle */}
          <div className="flex rounded-xl p-1 mb-6 bg-gray-100">
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
            <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-xl mb-4">
              <AlertCircle size={20} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 p-4 bg-green-50 text-green-700 rounded-xl mb-4">
              <CheckCircle size={20} />
              <span className="text-sm">{success}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                כתובת מייל
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
                  dir="ltr"
                />
              </div>
            </div>

            {/* Username (register only) */}
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  שם משתמש
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
                    minLength={3}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">לפחות 3 תווים</p>
              </div>
            )}

            {/* Full Name (register only) */}
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  שם מלא (אופציונלי)
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="השם המלא שלך"
                />
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                סיסמה
              </label>
              <div className="relative">
                <Lock size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="הסיסמה שלך"
                  required
                  minLength={6}
                  dir="ltr"
                />
              </div>
              {mode === 'register' && (
                <p className="text-xs text-gray-500 mt-1">לפחות 6 תווים</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl text-white font-semibold transition-all duration-300 ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'hover:scale-105 hover:shadow-lg'
              }`}
              style={!loading ? {
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)'
              } : {}}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  {mode === 'login' ? 'מתחבר...' : 'נרשם...'}
                </div>
              ) : (
                mode === 'login' ? 'התחבר' : 'הירשם'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="text-center mt-6 text-sm text-gray-600">
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
                יש לך כבר חשבון?{' '}
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

      <style jsx>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}