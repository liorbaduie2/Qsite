import { createServerClient } from "@supabase/ssr";
import { cookies as nextCookies } from "next/headers";
import NotesClient from "../components/NotesClient";

export default async function NotesServer() {
  const cookieStore = await nextCookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll: () => {
          // Map cookies to the format expected by Supabase
          return cookieStore.getAll().map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
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