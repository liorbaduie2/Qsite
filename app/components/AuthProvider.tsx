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
        
        // First check if profile exists
        const { data: existingProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (fetchError && fetchError.code === 'PGRST116') {
          // Profile doesn't exist, let's create it
          const { data: userData } = await supabase.auth.getUser();
          
          if (userData.user && userData.user.id === userId) {
            const newProfile = {
              id: userId,
              username: userData.user.email?.split('@')[0] || `user_${userId.slice(0, 8)}`,
              full_name: userData.user.user_metadata?.full_name || '',
            };

            const { data: createdProfile, error: createError } = await supabase
              .from('profiles')
              .insert([newProfile])
              .select()
              .single();

            if (createError) {
              setResult(`❌ Failed to create profile: ${createError.message}`);
            } else {
              setResult(`✅ Profile created successfully: ${JSON.stringify(createdProfile, null, 2)}`);
            }
          } else {
            setResult('❌ User not authenticated or ID mismatch');
          }
        } else if (fetchError) {
          setResult(`❌ Database error: ${fetchError.message}`);
        } else {
          setResult(`✅ Profile already exists: ${JSON.stringify(existingProfile, null, 2)}`);
        }
      } catch (error) {
        setResult(`❌ Unexpected error: ${error}`);
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
      background: 'rgba(0,0,0,0.9)',
      color: 'white',
      padding: '20px',
      maxWidth: '500px',
      fontSize: '12px',
      zIndex: 9999,
      borderRadius: '0 10px 0 0',
      maxHeight: '300px',
      overflow: 'auto'
    }}>
      <h4>🧪 Profile Test Results</h4>
      <pre style={{ whiteSpace: 'pre-wrap', fontSize: '11px' }}>{result}</pre>
    </div>
  );
}