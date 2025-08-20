import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import NotesClient from "../components/NotesClient";

export default async function NotesServer() {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll().map(({ name, value }) => ({ name, value })),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: notes } = await supabase.from("notes").select("*");

  return <NotesClient notes={notes || []} />;
}
