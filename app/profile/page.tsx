//app/profile/page.tsx - Updated for Dark/Light Mode
"use client";

import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
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
  BarChart3,
  CheckCircle,
  Clock,
  Music,
  Star
} from 'lucide-react';
import { useAuth } from '../components/AuthProvider';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

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

// Helper function to determine playlist icon and text
const getPlaylistInfo = (url: string | undefined) => {
  if (!url) {
    return {
      icon: <Globe size={18} className="text-gray-400 dark:text-gray-500" />,
      text: ''
    };
  }
  if (url.includes('spotify.com')) {
    return {
      icon: <Music size={18} className="text-green-500" />,
      text: 'פלייליסט ספוטיפיי'
    };
  }
  if (url.includes('music.apple.com')) {
    return {
      icon: <Music size={18} className="text-pink-500" />,
      text: 'פלייליסט אפל מיוזיק'
    };
  }
  return {
    icon: <Globe size={18} className="text-gray-400 dark:text-gray-500" />,
    text: url
  };
};

export default function ProfilePage() {
  const { user, profile, updateProfile, loading } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [editForm, setEditForm] = useState({
    username: '',
    bio: '',
    location: '',
    website: '',
    avatar_url: ''
  });

  const [sharedStatus, setSharedStatus] = useState<{ id: string; content: string; createdAt: string } | null>(null);
  const [removingShared, setRemovingShared] = useState(false);

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
      isAnswered: true,
      createdAt: '2024-12-14',
      tags: ['React', 'Hooks']
    },
    {
      id: 3,
      title: 'איך לבצע optimization ב-Next.js?',
      votes: 15,
      answers: 7,
      views: 412,
      isAnswered: false,
      createdAt: '2024-12-13',
      tags: ['Next.js', 'Performance']
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
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        avatar_url: profile.avatar_url || ''
      });
    }
  }, [user, profile, loading, router]);

  useEffect(() => {
    if (!user) {
      setSharedStatus(null);
      return;
    }
    fetch('/api/status/me')
      .then((res) => res.json())
      .then((data) => {
        const active = data.active?.sharedToProfile ? data.active : null;
        const fromHistory = (data.history || []).find((s: { sharedToProfile: boolean }) => s.sharedToProfile);
        const s = active || fromHistory;
        setSharedStatus(s ? { id: s.id, content: s.content, createdAt: s.createdAt } : null);
      })
      .catch(() => setSharedStatus(null));
  }, [user]);

  const removeSharedFromProfile = async () => {
    if (!sharedStatus) return;
    setRemovingShared(true);
    try {
      const res = await fetch(`/api/status/${sharedStatus.id}/share`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ share: false }),
      });
      if (res.ok) setSharedStatus(null);
    } finally {
      setRemovingShared(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleEditToggle = async () => {
    if (isEditing) {
      // Save changes
      if (updateProfile) {
        const success = await updateProfile(editForm);
        if (success) {
          setIsEditing(false);
        }
      }
    } else {
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    // Revert form to original profile data
    if (profile) {
      setEditForm({
        username: profile.username || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        avatar_url: profile.avatar_url || ''
      });
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">טוען פרופיל...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">לא נמצא פרופיל</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors"
          >
            חזור לעמוד הבית
          </button>
        </div>
      </div>
    );
  }

  const joinedDate = profile.created_at || new Date().toISOString();
  const reputation = profile.reputation ?? 0;
  const questionsAsked = profile.questions_count ?? 0;
  const answersGiven = profile.answers_count ?? 0;
  const bestAnswers = profile.best_answers_count ?? 0;
  const totalViews = profile.total_views ?? 0;

  const playlistInfo = getPlaylistInfo(isEditing ? editForm.website : profile.website);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              <ArrowRight size={20} />
              <span>חזור לעמוד הבית</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              פרופיל אישי
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6 sticky top-8">
              {/* Profile Header */}
              <div className="text-center mb-6">
                <div className="relative inline-block mb-4">
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.username}
                      width={96}
                      height={96}
                      className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-600 shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-400 to-purple-500 dark:from-indigo-500 dark:to-purple-600 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-600 shadow-lg">
                      <span className="text-2xl font-bold text-white">
                        {profile.username?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  {isEditing && (
                    <button className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 dark:bg-indigo-500 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors">
                      <Camera size={16} />
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editForm.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      placeholder="שם משתמש"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                    />
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      placeholder="ביוגרפיה - ספר קצת על עצמך"
                      rows={4}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-gray-900 dark:text-gray-100"
                    />
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">
                      {profile.full_name || profile.username}
                    </h2>
                    {profile.bio && (
                      <div className="mt-3 p-3 bg-gray-50/50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                          {profile.bio}
                        </p>
                      </div>
                    )}
                    {sharedStatus && (
                      <div className="mt-3 p-4 bg-amber-50/80 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700/50">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-medium">
                            <Star size={18} className="fill-current" />
                            מוצג בפרופיל (Featured)
                          </div>
                          <button
                            type="button"
                            onClick={removeSharedFromProfile}
                            disabled={removingShared}
                            className="text-xs px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 disabled:opacity-50"
                          >
                            {removingShared ? 'מסיר...' : 'הסר מפרופיל'}
                          </button>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                          {sharedStatus.content}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          {new Date(sharedStatus.createdAt).toLocaleDateString('he-IL')}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Profile Actions */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={handleEditToggle}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                    isEditing
                      ? 'bg-green-600 dark:bg-green-500 text-white hover:bg-green-700 dark:hover:bg-green-600'
                      : 'bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600'
                  }`}
                >
                  {isEditing ? <Save size={16} /> : <Edit3 size={16} />}
                  {isEditing ? 'שמור' : 'ערוך פרופיל'}
                </button>
                {isEditing && (
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Profile Details */}
              <div className="space-y-3 mb-6">
                {(profile.location || isEditing) && (
                  <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    <MapPin size={18} className="text-gray-400 dark:text-gray-500" />
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="מיקום (אופציונלי)"
                        className="flex-1 px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                      />
                    ) : (
                      <span>{profile.location}</span>
                    )}
                  </div>
                )}

                {(profile.website || isEditing) && (
                  <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    {playlistInfo.icon}
                    {isEditing ? (
                      <input
                        type="url"
                        value={editForm.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        placeholder="פלייליסט ספוטיפיי/אפל מיוזיק"
                        className="flex-1 px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                      />
                    ) : (
                      profile.website && (
                        <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                          {playlistInfo.text}
                        </a>
                      )
                    )}
                  </div>
                )}

                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <Calendar size={18} className="text-gray-400 dark:text-gray-500" />
                  <span>הצטרף ב-{new Date(joinedDate).toLocaleDateString('he-IL')}</span>
                </div>
              </div>

              {/* Reputation */}
              <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200 dark:border-yellow-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="text-yellow-600 dark:text-yellow-500" size={20} />
                  <span className="font-semibold text-gray-800 dark:text-gray-200">מוניטין</span>
                </div>
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">
                  {reputation}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">נקודות</div>
              </div>
              {reputation === 100 && (
                <div className="mt-3 p-3 bg-emerald-50/90 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl flex items-start gap-3">
                  <Star size={18} className="text-emerald-600 dark:text-emerald-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                      תג כבוד – מוניטין 100
                    </p>
                    <p className="text-xs text-emerald-800/80 dark:text-emerald-200/80 mt-0.5">
                      הגעת לרמת האמון הגבוהה ביותר בקהילה. תודה על התרומה שלך!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Tab Navigation */}
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 mb-6">
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                {[
                  { id: 'overview', label: 'סקירה כללית', icon: BarChart3 },
                  { id: 'questions', label: 'השאלות שלי', icon: HelpCircle },
                  { id: 'answers', label: 'התשובות שלי', icon: MessageSquare }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-all duration-300 ${
                      activeTab === tab.id
                        ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50/50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <tab.icon size={18} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Statistics Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-xl border border-blue-200 dark:border-blue-700/50">
                        <div className="flex items-center gap-2 mb-2">
                          <HelpCircle className="text-blue-600 dark:text-blue-400" size={20} />
                          <span className="font-semibold text-blue-800 dark:text-blue-200">שאלות</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{questionsAsked}</div>
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-xl border border-green-200 dark:border-green-700/50">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="text-green-600 dark:text-green-400" size={20} />
                          <span className="font-semibold text-green-800 dark:text-green-200">תשובות</span>
                        </div>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">{answersGiven}</div>
                      </div>

                      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-700/50">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="text-yellow-600 dark:text-yellow-500" size={20} />
                          <span className="font-semibold text-yellow-800 dark:text-yellow-200">תשובות מקובלות</span>
                        </div>
                        <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">{bestAnswers}</div>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-xl border border-purple-200 dark:border-purple-700/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Eye className="text-purple-600 dark:text-purple-400" size={20} />
                          <span className="font-semibold text-purple-800 dark:text-purple-200">צפיות</span>
                        </div>
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{totalViews}</div>
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">פעילות אחרונה</h3>
                      <div className="space-y-3">
                        {userQuestions.slice(0, 3).map((question) => (
                          <div key={question.id} className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-1">{question.title}</h4>
                              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                  <MessageSquare size={14} />
                                  {question.answers}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Eye size={14} />
                                  {question.views}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock size={14} />
                                  {new Date(question.createdAt).toLocaleDateString('he-IL')}
                                </span>
                              </div>
                            </div>
                            {question.isAnswered && (
                              <CheckCircle className="text-green-600 dark:text-green-400" size={18} />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'questions' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">השאלות שלי ({userQuestions.length})</h3>
                    </div>
                    <div className="space-y-4">
                      {userQuestions.map((question) => (
                        <div key={question.id} className="p-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-gray-800 dark:text-gray-200 flex-1">{question.title}</h4>
                            {question.isAnswered && (
                              <CheckCircle className="text-green-600 dark:text-green-400 ml-2" size={18} />
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <MessageSquare size={14} />
                                {question.answers} תשובות
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye size={14} />
                                {question.views} צפיות
                              </span>
                            </div>
                            <div className="flex gap-1">
                              {question.tags.map((tag) => (
                                <span key={tag} className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs rounded-full">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'answers' && (
                  <div className="text-center py-12">
                    <MessageSquare className="mx-auto text-gray-400 dark:text-gray-500 mb-4" size={48} />
                    <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">אין תשובות עדיין</h3>
                    <p className="text-gray-500 dark:text-gray-500">התחל לענות על שאלות כדי לראות אותן כאן</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}