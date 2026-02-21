"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { User, Send, ArrowRight } from "lucide-react";
import { useAuth } from "../../components/AuthProvider";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

type OtherUser = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
};

export default function ChatThreadPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId =
    typeof params?.conversationId === "string" ? params.conversationId : "";
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [conversation, setConversation] = useState<{
    id: string;
    created_at: string;
  } | null>(null);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  const { user, loading: authLoading } = useAuth();

  const fetchConversation = useCallback(async () => {
    if (!conversationId || !user) return;
    const res = await fetch(`/api/chat/conversations/${conversationId}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "שגיאה");
      setConversation(null);
      setOtherUser(null);
      return;
    }
    setConversation(data.conversation);
    setOtherUser(data.otherUser);
    setError(null);
  }, [conversationId, user]);

  const fetchMessages = useCallback(async () => {
    if (!conversationId || !user) return;
    const res = await fetch(
      `/api/chat/conversations/${conversationId}/messages?limit=100`,
    );
    const data = await res.json();
    if (res.ok) setMessages(data.messages || []);
  }, [conversationId, user]);

  useEffect(() => {
    if (!conversationId) {
      setLoading(false);
      setError("שיחה לא נמצאה");
      return;
    }
    if (!user) {
      setLoading(false);
      router.replace("/chat");
      return;
    }
    setLoading(true);
    Promise.all([fetchConversation(), fetchMessages()]).finally(() =>
      setLoading(false),
    );
  }, [conversationId, user, router, fetchConversation, fetchMessages]);

  // Mark conversation as read when loaded (user is participant)
  useEffect(() => {
    if (!conversationId || !user || !conversation || error) return;
    fetch(`/api/chat/conversations/${conversationId}/read`, {
      method: "POST",
    }).catch(() => {});
  }, [conversationId, user, conversation, error]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Real-time: subscribe to new messages in this conversation
  useEffect(() => {
    if (!conversationId || !user) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`chat-messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            conversation_id: string;
            sender_id: string;
            content: string;
            created_at: string;
          };
          if (!row?.id) return;
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [
              ...prev,
              {
                id: row.id,
                conversation_id: row.conversation_id,
                sender_id: row.sender_id,
                content: row.content,
                created_at: row.created_at,
              },
            ];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = content.trim();
    if (!text || !conversationId || !user || sending) return;
    setSending(true);
    try {
      const res = await fetch(
        `/api/chat/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text }),
        },
      );
      const data = await res.json();
      if (res.ok && data.message) {
        setMessages((prev) => [...prev, data.message]);
        setContent("");
      }
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("he-IL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (authLoading) {
    return (
      <div
        className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center"
        dir="rtl"
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400" />
      </div>
    );
  }

  if (!user) {
    router.replace("/chat");
    return null;
  }

  if (loading && !otherUser) {
    return (
      <div
        className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center"
        dir="rtl"
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400" />
      </div>
    );
  }

  if (error || !otherUser) {
    return (
      <div
        className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center gap-4 px-4"
        dir="rtl"
      >
        <p className="text-gray-600 dark:text-gray-400">
          {error || "שיחה לא נמצאה"}
        </p>
        <Link
          href="/chat"
          className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          <ArrowRight size={18} /> חזרה לצ'אט
        </Link>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 flex flex-col"
      dir="rtl"
    >
      <header
        className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-xl border-b border-gray-200/20 dark:border-gray-700/50 px-4"
        dir="rtl"
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4 py-2">
          {/* Right: back button (start in RTL) */}
          <div className="flex-1 min-w-0 flex justify-start">
            <Link
              href="/chat"
              className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 py-2 ms-[1rem]"
            >
              <ArrowRight size={20} /> חזרה
            </Link>
          </div>
          {/* Center: avatar + name (shifted left) */}
          <div className="flex items-center justify-center gap-2 min-w-0 flex-shrink-0 ms-[35rem]">
            {otherUser.avatar_url ? (
              <Image
                src={otherUser.avatar_url}
                alt=""
                width={36}
                height={36}
                className="w-9 h-9 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-indigo-200 dark:bg-indigo-800 flex items-center justify-center border-2 border-white dark:border-gray-700 shadow">
                <User
                  size={18}
                  className="text-indigo-700 dark:text-indigo-300"
                />
              </div>
            )}
            <span className="text-lg font-bold text-gray-800 dark:text-gray-100 truncate max-w-[140px] sm:max-w-[200px]">
              {otherUser.full_name || otherUser.username || "צ'אט"}
            </span>
          </div>
          {/* Left: spacer so center stays centered (end in RTL) */}
          <div className="flex-1 min-w-0 flex justify-end" aria-hidden />
        </div>
      </header>

      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              אין הודעות עדיין. התחל את השיחה.
            </p>
          )}
          {messages.map((m) => {
            const isMe = m.sender_id === user.id;
            return (
              <div
                key={m.id}
                className={`flex ${isMe ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    isMe
                      ? "bg-indigo-600 text-white rounded-br-md"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-md"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  <p
                    className={`text-xs mt-1 ${isMe ? "text-indigo-200" : "text-gray-500 dark:text-gray-400"}`}
                  >
                    {formatTime(m.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={handleSend}
          className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/70"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="כתוב הודעה..."
              className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              maxLength={10000}
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!content.trim() || sending}
              className="p-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={22} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
