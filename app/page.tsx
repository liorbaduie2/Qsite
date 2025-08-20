"use client"; // Make this a client component

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { DeployButton } from "@/components/deploy-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { Hero } from "@/components/hero";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { ConnectSupabaseSteps } from "@/components/tutorial/connect-supabase-steps";
import { SignUpUserSteps } from "@/components/tutorial/sign-up-user-steps";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";

export default function Home() {
  const supabase = createClientComponentClient();
  const [notes, setNotes] = useState<{ id: number; title: string }[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch notes from Supabase
  const fetchNotes = async () => {
    const { data, error } = await supabase.from("notes").select("*");
    if (error) {
      console.error(error);
    } else {
      setNotes(data || []);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  // Add a new note
  const addNote = async () => {
    if (!newNote.trim()) return;
    setLoading(true);
    const { data, error } = await supabase.from("notes").insert([{ title: newNote }]).select();
    setLoading(false);
    if (error) {
      console.error(error);
    } else if (data) {
      setNotes((prev) => [...prev, ...data]);
      setNewNote("");
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"}>Next.js Supabase Starter</Link>
              <div className="flex items-center gap-2">
                <DeployButton />
              </div>
            </div>
            {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
          </div>
        </nav>

        <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5">
          <Hero />

          {/* Notes Section */}
          <section className="flex flex-col gap-4 px-4">
            <h2 className="font-medium text-xl mb-2">Supabase Notes</h2>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Enter new note"
                className="border p-2 flex-1"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
              <button
                onClick={addNote}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                Add
              </button>
            </div>
            <ul className="list-disc pl-5">
              {notes.map((note) => (
                <li key={note.id}>{note.title}</li>
              ))}
            </ul>
          </section>

          <main className="flex-1 flex flex-col gap-6 px-4">
            <h2 className="font-medium text-xl mb-4">Next steps</h2>
            {hasEnvVars ? <SignUpUserSteps /> : <ConnectSupabaseSteps />}
          </main>
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          <p>
            Powered by{" "}
            <a
              href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
              target="_blank"
              className="font-bold hover:underline"
              rel="noreferrer"
            >
              Supabase
            </a>
          </p>
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}
