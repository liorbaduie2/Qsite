"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function HomePage() {
  const [messages, setMessages] = useState<{ id: number; content: string }[]>([]);
  const [newMessage, setNewMessage] = useState("");

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("messages")
      .select()
      .order("id", { ascending: true });
    if (!error && data) setMessages(data);
  };

  useEffect(() => {
    fetchMessages();

    const subscription = supabase
      .channel("public:messages")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const submitMessage = async () => {
    if (!newMessage.trim()) return;
    const { error } = await supabase.from("messages").insert([{ content: newMessage }]);
    if (!error) setNewMessage("");
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Supabase Messages</h1>
      <div>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Ente
