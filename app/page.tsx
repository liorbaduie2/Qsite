'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function MessagesPage() {
  const [messages, setMessages] = useState<{ id: number; content: string }[]>([]);
  const [newMessage, setNewMessage] = useState('');

  // Fetch messages from Supabase
  useEffect(() => {
    fetchMessages();

    // Optional: real-time updates
    const subscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        payload => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  async function fetchMessages() {
    const { data, error } = await supabase.from('messages').select('*').order('id');
    if (error) console.error(error);
    else setMessages(data);
  }

  // Add a new message
  async function handleSubmit() {
    if (!newMessage) return;
    const { data, error } = await supabase.from('messages').insert([{ content: newMessage }]);
    if (error) console.error(error);
    else setNewMessage(''); // Clear input
    fetchMessages();
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Messages</h1>

      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Enter a message"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          style={{ padding: '0.5rem', width: '300px', marginRight: '0.5rem' }}
        />
        <button onClick={handleSubmit} style={{ padding: '0.5rem 1rem' }}>
          Submit
        </button>
      </div>

      <ul>
        {messages.map(msg => (
          <li key={msg.id} style={{ marginBottom: '0.5rem' }}>
            {msg.content}
          </li>
        ))}
      </ul>
    </div>
  );
}
