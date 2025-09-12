"use client";

import React, { useState, useEffect } from 'react';
import { Camera, Edit3, Mail, MapPin, Globe, Trophy, // Removed User and Settings - were unused
         MessageCircle, Award, Eye, Calendar, ArrowRight, 
         Save, X, Upload, Star, TrendingUp } from 'lucide-react';
import Image from 'next/image'; // Added Next.js Image component
import { useAuth } from '../components/AuthProvider';

interface UserStats {
  questionsCount: number;
  answersCount: number;
  bestAnswersCount: number;
  totalViews: number;
  reputation: number;
}

interface Question {
  id: string;
  title: string;
  votes_count: number;
  answers_count: number;
  views_count: number;
  created_at: string;
  tags: string[];
}

export default function ProfilePage() {
  const { user, profile, updateProfile, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    bio: '',
    location: '',
    website: '',
  });
  const [userStats, setUserStats] = useState<UserStats>({
    questionsCount: 0,
    answersCount: 0,
    bestAnswersCount: 0,
    totalViews: 0,
    reputation: 0,
  });
  const [recentQuestions, setRecentQuestions] = useState<Question[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setEditForm({
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
      });
      setUserStats({
        questionsCount: 12,
        answersCount: 45,
        bestAnswersCount: 8,
        totalViews: 2345,
        reputation: profile.reputation || 0,
      });
    }

    // Mock recent questions data
    const mockQuestions: Question[] = [
      {
        id: '1',
        title: 'איך להתחיל ללמוד React בצורה נכונה?',
        votes_count: 15,
        answers_count: 8,
        views_count: 156,
        created_at: '2024-01-15T10:30:00Z',
        tags: ['React', 'למידה', 'מתחילים']
      },
      {
        id: '2',
        title: 'בעיה עם Next.js ו-TypeScript',
        votes_count: 23,
        answers_count: 12,
        views_count: 298,
        created_at: '2024-01-14T16:45:00Z',
        tags: ['Next.js', 'TypeScript']
      }
    ];
    setRecentQuestions(mockQuestions);
  }, [profile]);

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

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">נדרשת התחברות</h1>
          <p className="text-gray-600 mb-8">עליך להתחבר כדי לצפות בפרופיל</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            חזור לעמוד הבית
          </button>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile(editForm);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `לפני ${diffInMinutes} דקות`;
    } else if (diffInMinutes < 1440) {
      return `לפני ${Math.floor(diffInMinutes / 60)} שעות`;
    } else {
      return `לפני ${Math.floor(diffInMinutes / 1440)} ימים`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
          {/* Cover Image */}
          <div className="h-48 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 relative">
            <div className="absolute inset-0 bg-black/20"></div>
            <button className="absolute top-4 left-4 p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors">
              <Camera size={20} />
            </button>
          </div>

          {/* Profile Info */}
          <div className="relative px-8 pb-8">
            {/* Avatar */}
            <div className="absolute -top-16 right-8">
              <div className="relative">
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.username}
                    width={128}
                    height={128}
                    className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white text-4xl font-bold">
                    {profile.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <button className="absolute bottom-2 left-2 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors shadow-lg">
                  <Camera size={16} />
                </button>
              </div>
            </div>

            {/* Edit Button */}
            <div className="flex justify-end pt-4 mb-4">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Edit3 size={16} />
                  עריכת פרופיל
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    <Save size={16} />
                    {saving ? 'שומר...' : 'שמור'}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <X size={16} />
                    ביטול
                  </button>
                </div>
              )}
            </div>

            {/* User Details */}
            <div className="mt-16 grid md:grid-cols-2 gap-8">
              <div>
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">שם מלא</label>
                      <input
                        type="text"
                        value={editForm.full_name}
                        onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="השם המלא שלך"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">אודות</label>
                      <textarea
                        value={editForm.bio}
                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                        rows={4}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        placeholder="ספר על עצמך..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">מיקום</label>
                      <input
                        type="text"
                        value={editForm.location}
                        onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="העיר שלך"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">אתר אינטרנט</label>
                      <input
                        type="url"
                        value={editForm.website}
                        onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                      {profile.full_name || profile.username}
                    </h1>
                    <p className="text-lg text-gray-600 mb-4">@{profile.username}</p>
                    
                    {profile.bio && (
                      <p className="text-gray-700 mb-6 leading-relaxed">{profile.bio}</p>
                    )}

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail size={16} />
                        <span className="text-sm">{user.email}</span>
                      </div>
                      {profile.location && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin size={16} />
                          <span className="text-sm">{profile.location}</span>
                        </div>
                      )}
                      {profile.website && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Globe size={16} />
                          <a 
                            href={profile.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-indigo-600 hover:underline"
                          >
                            {profile.website}
                          </a>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={16} />
                        <span className="text-sm">הצטרף ב-{formatDate(profile.created_at || user.created_at)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-indigo-600 text-white rounded-lg">
                      <Trophy size={20} />
                    </div>
                    <span className="text-sm text-gray-600">מוניטין</span>
                  </div>
                  <p className="text-2xl font-bold text-indigo-600">{userStats.reputation}</p>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-600 text-white rounded-lg">
                      <MessageCircle size={20} />
                    </div>
                    <span className="text-sm text-gray-600">שאלות</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{userStats.questionsCount}</p>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-600 text-white rounded-lg">
                      <Award size={20} />
                    </div>
                    <span className="text-sm text-gray-600">תשובות</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">{userStats.answersCount}</p>
                </div>

                <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-xl border border-orange-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-orange-600 text-white rounded-lg">
                      <Eye size={20} />
                    </div>
                    <span className="text-sm text-gray-600">צפיות</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-600">{userStats.totalViews.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          {[
            { id: 'overview', label: 'סקירה', icon: TrendingUp },
            { id: 'questions', label: 'שאלות', icon: MessageCircle },
            { id: 'answers', label: 'תשובות', icon: Award },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <>
              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6">פעילות אחרונה</h3>
                <div className="space-y-4">
                  {recentQuestions.map((question) => (
                    <div key={question.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 mb-2">{question.title}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Star size={14} />
                            <span>{question.votes_count} קולות</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle size={14} />
                            <span>{question.answers_count} תשובות</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye size={14} />
                            <span>{question.views_count} צפיות</span>
                          </div>
                          <span>{formatTimeAgo(question.created_at)}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {question.tags.map((tag) => (
                            <span key={tag} className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-md">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <ArrowRight size={20} className="text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Achievements */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6">הישגים</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="p-2 bg-yellow-500 text-white rounded-lg">
                      <Trophy size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-yellow-800">תורם פעיל</p>
                      <p className="text-sm text-yellow-600">10+ שאלות באיכות גבוהה</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="p-2 bg-green-500 text-white rounded-lg">
                      <Award size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-green-800">עוזר מצוין</p>
                      <p className="text-sm text-green-600">5+ תשובות מקובלות</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="p-2 bg-blue-500 text-white rounded-lg">
                      <Star size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-blue-800">חבר קהילה</p>
                      <p className="text-sm text-blue-600">חבר כבר יותר מחודש</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'questions' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6">השאלות שלי</h3>
              <div className="space-y-4">
                {recentQuestions.map((question) => (
                  <div key={question.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <h4 className="font-semibold text-gray-800 mb-2">{question.title}</h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{question.votes_count} קולות</span>
                        <span>{question.answers_count} תשובות</span>
                        <span>{question.views_count} צפיות</span>
                      </div>
                      <span className="text-sm text-gray-500">{formatTimeAgo(question.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'answers' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6">התשובות שלי</h3>
              <div className="text-center py-12">
                <Award size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">עדיין לא כתבת תשובות</p>
                <p className="text-sm text-gray-500 mt-2">התחל לעזור לחברי הקהילה ותראה את התשובות שלך כאן</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}