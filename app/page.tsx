'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Home() {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    async function fetchNotes() {
      const { data, error } = await supabase.from('notes').select('*');
      if (error) console.error(error);
      else setNotes(data);
    }
    fetchNotes();
  }, []);

  return (
    <div>
      <h1>Notes from Supabase</h1>
      <pre>{JSON.stringify(notes, null, 2)}</pre>
    </div>
  );
}
