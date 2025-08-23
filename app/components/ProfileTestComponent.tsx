// First, create this file: components/ProfileTestComponent.tsx

"use client";

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export function ProfileTestComponent() {
  const [result, setResult] = useState<string>('Testing...');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const testProfile = async () => {
      try {
        const userId = '867c83cf-ecc0-4e1d-8d0e-0652915dabee';
        
        console.log('Testing profile for user:', userId);
        
        // First check if profile exists
        const { data: existingProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (fetchError && fetchError.code === 'PGRST116') {
          console.log('Profile does not exist, attempting to create...');
          
          // Profile doesn't exist, let's create it
          const { data: userData } = await supabase.auth.getUser();
          
          if (userData.user && userData.user.id === userId) {
            const newProfile = {
              id: userId,
              username: userData.user.email?.split('@')[0] || `user_${userId.slice(0, 8)}`,
              full_name: userData.user.user_metadata?.full_name || '',
            };

            console.log('Creating profile with data:', newProfile);

            const { data: createdProfile, error: createError } = await supabase
              .from('profiles')
              .insert([newProfile])
              .select()
              .single();

            if (createError) {
              setResult(`❌ Failed to create profile: ${createError.message}\n\nDetails: ${JSON.stringify(createError, null, 2)}`);
            } else {
              setResult(`✅ Profile created successfully!\n\nProfile data:\n${JSON.stringify(createdProfile, null, 2)}`);
            }
          } else if (!userData.user) {
            setResult('❌ User not authenticated - please log in first');
          } else {
            setResult(`❌ User ID mismatch:\nExpected: ${userId}\nActual: ${userData.user.id}`);
          }
        } else if (fetchError) {
          setResult(`❌ Database error: ${fetchError.message}\n\nCode: ${fetchError.code}\n\nDetails: ${JSON.stringify(fetchError, null, 2)}`);
        } else {
          setResult(`✅ Profile already exists:\n\n${JSON.stringify(existingProfile, null, 2)}`);
        }
      } catch (error) {
        setResult(`❌ Unexpected error: ${error}\n\nStack: ${error instanceof Error ? error.stack : 'No stack trace'}`);
      }
    };

    testProfile();
  }, []);

  // Don't show in production
  if (process.env.NODE_ENV === 'production') return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      background: 'rgba(0,0,0,0.95)',
      color: 'white',
      padding: '20px',
      maxWidth: '600px',
      fontSize: '12px',
      zIndex: 9999,
      borderRadius: '0 10px 0 0',
      maxHeight: '400px',
      overflow: 'auto',
      fontFamily: 'monospace',
      border: '2px solid #333'
    }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#4CAF50' }}>🧪 Profile Test Results</h4>
      <pre style={{ 
        whiteSpace: 'pre-wrap', 
        fontSize: '11px',
        lineHeight: '1.4',
        margin: 0,
        color: '#f0f0f0'
      }}>{result}</pre>
      <button 
        onClick={() => window.location.reload()} 
        style={{
          marginTop: '10px',
          padding: '5px 10px',
          background: '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '3px',
          cursor: 'pointer',
          fontSize: '11px'
        }}
      >
        Reload Test
      </button>
    </div>
  );
}

// ====================================
// Then, add it to your main page.tsx file:
// ====================================

// In your page.tsx file, add this import at the top:
import { ProfileTestComponent } from './components/ProfileTestComponent';

// Then add <ProfileTestComponent /> just before the closing </div> of your main container
// Like this:

const ForumHomepage = () => {
  // ... your existing code ...

  return (
    <div 
      className="min-h-screen relative"
      dir="rtl"
      style={{
        fontFamily: 'Assistant, system-ui, sans-serif',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        color: '#0f172a'
      }}
    >
      {/* ... all your existing content ... */}
      
      {/* Add this line before the closing div */}
      <ProfileTestComponent />
    </div>
  );
};