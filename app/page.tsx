import Link from 'next/link';
import { AuthModal } from './components/AuthModal';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            פורום הקהילה
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            פורום קהילת המפתחים הישראלית - שאל שאלות, שתף ידע וקבל עזרה מקהילת המפתחים
          </p>
        </header>

        {/* Navigation */}
        <div className="flex justify-center mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/questions"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium transition-colors duration-200 text-center"
              >
                צפה בשאלות
              </Link>
              
              <AuthModal />
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="text-3xl mb-4">?</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              שאל שאלות
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              שאל שאלות טכניות וקבל תשובות מהקהילה
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="text-3xl mb-4">??</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              שתף ידע
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              עזור לאחרים על ידי שיתוף הידע והניסיון שלך
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="text-3xl mb-4">??</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              התחבר לקהילה
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              בנה קשרים עם מפתחים אחרים בקהילה הישראלית
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            הצטרף לקהילה הגדלה
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">1000+</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">מפתחים</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">500+</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">שאלות</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">2000+</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">תשובות</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">24/7</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">פעילות</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}