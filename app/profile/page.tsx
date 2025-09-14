//app\profile\page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
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
  BarChart3,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useAuth } from '../components/AuthProvider';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

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
      isAnswered: true,
      createdAt: '2024-12-14',
      tags: ['React', 'Hooks']
    },
    {
      id: 3,
      title: 'איך לבצע optimization ב-Next.js?',
      votes: 15,
      answers: 7,
      views: 289,
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
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        avatar_url: profile.avatar_url || ''
      });
    }
  }, [user, profile, loading, router]);

  const handleEditToggle = () => {
    if (isEditing) {
      // Save changes
      updateProfile(editForm);
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (field: string, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">גישה לא מורשית</h2>
          <p className="text-gray-600 mb-6">אנא התחבר כדי לגשת לפרופיל</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            חזור לעמוד הבית
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
      dir="rtl"
      style={{ fontFamily: 'Assistant, system-ui, sans-serif' }}
    >
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl shadow-xl border-b border-gray-200/20">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowRight size={20} />
              <span>חזור לעמוד הבית</span>
            </button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              פרופיל אישי
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6 sticky top-8">
              {/* Profile Header */}
              <div className="text-center mb-6">
                <div className="relative inline-block mb-4">
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.username}
                      width={96}
                      height={96}
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                      <span className="text-2xl font-bold text-white">
                        {profile.username?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  {isEditing && (
                    <button className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 transition-colors">
                      <Camera size={16} />
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editForm.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      placeholder="שם מלא"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      value={editForm.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      placeholder="שם משתמש"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      placeholder="ביוגרפיה"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    />
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-gray-800 mb-1">
                      {profile.full_name || profile.username}
                    </h2>
                    <p className="text-gray-600 mb-2">@{profile.username}</p>
                    {profile.bio && (
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {profile.bio}
                      </p>
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
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {isEditing ? <Save size={16} /> : <Edit3 size={16} />}
                  {isEditing ? 'שמור' : 'ערוך'}
                </button>
                {isEditing && (
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Profile Info */}
              <div className="space-y-4">
                {profile.location && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <MapPin size={18} className="text-gray-400" />
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="מיקום"
                        className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    ) : (
                      <span>{profile.location}</span>
                    )}
                  </div>
                )}

                {profile.website && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <Globe size={18} className="text-gray-400" />
                    {isEditing ? (
                      <input
                        type="url"
                        value={editForm.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        placeholder="אתר אינטרנט"
                        className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    ) : (
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                        {profile.website}
                      </a>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-3 text-gray-600">
                  <Mail size={18} className="text-gray-400" />
                  <span>{user.email}</span>
                </div>

                <div className="flex items-center gap-3 text-gray-600">
                  <Calendar size={18} className="text-gray-400" />
                  <span>הצטרף ב-{new Date(userStats.joinedDate).toLocaleDateString('he-IL')}</span>
                </div>
              </div>

              {/* Reputation */}
              <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="text-yellow-600" size={20} />
                  <span className="font-semibold text-gray-800">מוניטין</span>
                </div>
                <div className="text-2xl font-bold text-yellow-600">
                  {userStats.reputation}
                </div>
                <div className="text-sm text-gray-600">נקודות</div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Tab Navigation */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 mb-6">
              <div className="flex border-b border-gray-200">
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
                        ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50/50'
                    }`}
                  >
                    <tab.icon size={18} />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6">
              {activeTab === 'overview' && (
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-6">סקירה כללית</h3>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                      { label: 'שאלות', value: userStats.questionsAsked, icon: HelpCircle, color: 'blue' },
                      { label: 'תשובות', value: userStats.answersGiven, icon: MessageSquare, color: 'green' },
                      { label: 'תשובות מקובלות', value: userStats.bestAnswers, icon: CheckCircle, color: 'yellow' },
                      { label: 'צפיות', value: userStats.totalViews, icon: Eye, color: 'purple' }
                    ].map((stat) => (
                      <div key={stat.label} className={`p-4 rounded-xl bg-${stat.color}-50 border border-${stat.color}-200`}>
                        <div className="flex items-center gap-2 mb-2">
                          <stat.icon size={18} className={`text-${stat.color}-600`} />
                          <span className="text-sm font-medium text-gray-700">{stat.label}</span>
                        </div>
                        <div className={`text-2xl font-bold text-${stat.color}-600`}>
                          {stat.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Recent Activity */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">פעילות אחרונה</h4>
                    <div className="space-y-3">
                      {[
                        { action: 'שאל שאלה חדשה', title: 'איך לבצע optimization ב-Next.js?', time: 'לפני יום' },
                        { action: 'קיבל תשובה מקובלת', title: 'מה ההבדל בין useState ל-useReducer?', time: 'לפני 2 ימים' },
                        { action: 'ענה על שאלה', title: 'איך ללמוד React בצורה יעילה?', time: 'לפני 3 ימים' }
                      ].map((activity, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Clock size={16} className="text-gray-400" />
                          <div className="flex-1">
                            <span className="font-medium text-gray-800">{activity.action}: </span>
                            <span className="text-gray-600">{activity.title}</span>
                          </div>
                          <span className="text-sm text-gray-500">{activity.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'questions' && (
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-6">השאלות שלי</h3>
                  <div className="space-y-4">
                    {userQuestions.map((question) => (
                      <div key={question.id} className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-2">
                          {question.isAnswered && (
                            <CheckCircle size={16} className="text-green-600" />
                          )}
                          <h4 className="font-semibold text-gray-800">{question.title}</h4>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <span>{question.votes} הצבעות</span>
                          <span>{question.answers} תשובות</span>
                          <span>{question.views} צפיות</span>
                          <span>{new Date(question.createdAt).toLocaleDateString('he-IL')}</span>
                        </div>
                        <div className="flex gap-2">
                          {question.tags.map((tag) => (
                            <span key={tag} className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
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
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-6">התשובות שלי</h3>
                  <div className="text-center py-12">
                    <MessageSquare size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">אין תשובות להציג כרגע</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}