const fetchProfile = useCallback(async (userId: string) => {
  try {
    console.log('Fetching profile for:', userId);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Profile fetch error:', error);
      // If no profile found, create a default one
      if (error.code === 'PGRST116') {
        console.log('No profile found, creating default...');
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            username: `user_${userId.substring(0, 8)}`,
            full_name: 'User'
          })
          .select()
          .single();
        
        if (!createError) {
          setProfile(newProfile);
        }
      }
      setProfile(null);
      return;
    }
    
    console.log('Profile found:', data);
    setProfile(data);
  } catch (error) {
    console.error('Error fetching profile:', error);
    setProfile(null);
  }
}, [supabase]);