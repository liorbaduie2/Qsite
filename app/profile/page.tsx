"use client";

import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  User, 
  Mail, 
  MapPin, 
  Globe, 
  Calendar, 
  Award, 
  MessageSquare, 
  HelpCircle, 
  Eye,
  Edit3,
  Save,
  X,
  Camera,
  Settings,
  BarChart3,
  TrendingUp,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useAuth } from '../components/AuthProvider';
import { useRouter } from 'next/navigation';

interface UserStats {
  questionsAsked: number;
  answersGiven: number;
  bestAnswers: number;
  totalViews: number;
  reputation: number;
  joinedDate: string;
}

interface Question {
  id: number;
  title: string;
  votes: number;
  answers: number;
  views: number;
  isAnswered: boolean;
  createdAt: string;
  tags: string[];
}

export default function ProfilePage() {
  const { user, profile, updateProfile, loading } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [editForm, setEditForm] = useState({
    username: '',
    full_name: '',
    bio: '',
    location: '',
    website: '',
    avatar_url: ''
  });

  // Mock data - replace with real data from Supabase
  const [userStats] = useState<UserStats>({
    questionsAsked: 12,
    answersGiven: 34,
    bestAnswers: 8,
    totalViews: 1250,
    reputation: profile?.reputation || 156,
    joinedDate: '2024-01-15'
  });

  const [userQuestions] = useState<Question[]>([
    {
      id: 1,
      title: 'איך ללמוד React בצורה יעילה?',
      votes: 12,
      answers: 5,
      views: 234,
      isAnswered: true,
      createdAt: '2024-12-15',
      tags: ['React', 'למידה']
    },
    {
      id: 2,
      title: 'מה ההבדל בין useState ל-useReducer?',
      votes: 8,
      answers: 3,
      views: 156,
      isAnswered: false,
      createdAt: '2024-12-10',
      tags: ['React', 'Hooks']
    }
  ]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
      return;
    }

    if (profile) {
      setEditForm({
        username: profile.username || '',
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        avatar_url: profile.avatar_url || ''
      });
    }
  }, [user, profile, loading, router]);

  const handleEditSave = async () => {
    try {
      await updateProfile(editForm);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">טוען פרופיל...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50"
      dir="rtl"
      style={{ fontFamily: 'Assistant, system-ui, sans-serif' }}
    >
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl shadow-lg border-b border-gray-200/20">
        <div className="max-w-6xl mx-auto px-5 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100/60 rounded-lg transition-all duration-300"
            >
              <ArrowRight size={20} />
              <span>חזרה לדף הראשי</span>
            </button>
            
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              פרופיל משתמש
            </h1>
            
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-300"
            >
              {isEditing ? <X size={16} /> : <Edit3 size={16} />}
              {isEditing ? 'ביטול' : 'עריכה'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Profile Info */}
          <div className="lg:col-span-1">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/30 p-6 sticky top-8">
              {/* Avatar Section */}
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt={profile.username}
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                      {profile?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                  
                  {isEditing && (
                    <button className="absolute bottom-0 right-0 p-2 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors">
                      <Camera size={16} />
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="mt-4 space-y-3">
                    <input
                      type="text"
                      value={editForm.username}
                      onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg text-center font-bold text-lg"
                      placeholder="שם משתמש"
                    />
                    <input
                      type="text"
                      value={editForm.full_name}
                      onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg text-center"
                      placeholder="שם מלא"
                    />
                  </div>
                ) : (
                  <div className="mt-4">
                    <h2 className="text-xl font-bold text-gray-800">
                      {profile?.full_name || profile?.username}
                    </h2>
                    <p className="text-gray-600">@{profile?.username}</p>
                  </div>
                )}
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="text-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                  <div className="font-bold text-lg text-indigo-600">{userStats.reputation}</div>
                  <div className="text-xs text-gray-600">נקודות מוניטין</div>
                </div>
                <div className="text-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                  <div className="font-bold text-lg text-green-600">{userStats.questionsAsked}</div>
                  <div className="text-xs text-gray-600">שאלות שנשאלו</div>
                </div>
                <div className="text-center p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                  <div className="font-bold text-lg text-purple-600">{userStats.answersGiven}</div>
                  <div className="text-xs text-gray-600">תשובות שניתנו</div>
                </div>
                <div className="text-center p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl">
                  <div className="font-bold text-lg text-orange-600">{userStats.bestAnswers}</div>
                  <div className="text-xs text-gray-600">תשובות מועילות</div>
                </div>
              </div>

              {/* Profile Details */}
              <div className="space-y-4">
                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">אודות</label>
                  {isEditing ? (
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                      rows={3}
                      placeholder="ספר על עצמך..."
                    />
                  ) : (
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {profile?.bio || 'המשתמש לא הוסיף מידע אודות עצמו.'}
                    </p>
                  )}
                </div>

                {/* Contact Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail size={16} />
                    <span>{user.email}</span>
                  </div>
                  
                  {(isEditing || profile?.location) && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin size={16} className="text-gray-400" />
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.location}
                          onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                          className="flex-1 p-1 border border-gray-300 rounded text-sm"
                          placeholder="מיקום"
                        />
                      ) : (
                        <span className="text-gray-600">{profile?.location}</span>
                      )}
                    </div>
                  )}
                  
                  {(isEditing || profile?.website) && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe size={16} className="text-gray-400" />
                      {isEditing ? (
                        <input
                          type="url"
                          value={editForm.website}
                          onChange={(e) => setEditForm({...editForm, website: e.target.value})}
                          className="flex-1 p-1 border border-gray-300 rounded text-sm"
                          placeholder="אתר אינטרנט"
                        />
                      ) : (
                        <a href={profile?.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                          {profile?.website}
                        </a>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar size={16} />
                    <span>הצטרף ב{formatDate(userStats.joinedDate)}</span>
                  </div>
                </div>

                {isEditing && (
                  <button
                    onClick={handleEditSave}
                    className="w-full flex items-center justify-center gap-2 p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Save size={16} />
                    שמור שינויים
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/30 mb-6">
              <div className="flex border-b border-gray-200">
                {[
                  { id: 'overview', label: 'סקירה כללית', icon: BarChart3 },
                  { id: 'questions', label: 'השאלות שלי', icon: HelpCircle },
                  { id: 'answers', label: 'התשובות שלי', icon: MessageSquare },
                  { id: 'activity', label: 'פעילות', icon: TrendingUp }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/30 p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">סטטיסטיקות</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Eye size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <div className="font-bold text-lg">{userStats.totalViews.toLocaleString()}</div>
                          <div className="text-sm text-gray-600">סה"כ צפיות</div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Award size={20} className="text-green-600" />
                        </div>
                        <div>
                          <div className="font-bold text-lg">{userStats.bestAnswers}</div>
                          <div className="text-sm text-gray-600">תשובות מקובלות</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <h4 className="font-semibold text-gray-800 mb-3">השאלות האחרונות</h4>
                    <div className="space-y-3">
                      {userQuestions.slice(0, 3).map((question) => (
                        <div key={question.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-800 mb-2">{question.title}</h5>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span>{question.votes} הצבעות</span>
                                <span>{question.answers} תשובות</span>
                                <span>{question.views} צפיות</span>
                              </div>
                            </div>
                            {question.isAnswered && (
                              <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'questions' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-800">השאלות שלי</h3>
                    <span className="text-sm text-gray-600">{userQuestions.length} שאלות</span>
                  </div>
                  
                  <div className="space-y-4">
                    {userQuestions.map((question) => (
                      <div key={question.id} className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <h4 className="font-medium text-gray-800 flex-1">{question.title}</h4>
                          {question.isAnswered ? (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">נענה</span>
                          ) : (
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">ממתין</span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <span>{question.votes} הצבעות</span>
                          <span>{question.answers} תשובות</span>
                          <span>{question.views} צפיות</span>
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {formatDate(question.createdAt)}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {question.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'answers' && (
                <div className="text-center py-12">
                  <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">עדיין אין תשובות</h3>
                  <p className="text-gray-500">התחל לענות על שאלות כדי לראות אותן כאן</p>
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="text-center py-12">
                  <TrendingUp size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">לוח פעילות</h3>
                  <p className="text-gray-500">כאן תוצג הפעילות האחרונה שלך</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}