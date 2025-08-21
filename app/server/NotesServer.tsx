import { createServerClient } from "@supabase/ssr";
import { cookies as nextCookies } from "next/headers";
import NotesClient from "../components/NotesClient";

export default async function NotesServer() {
  const cookieStore = nextCookies();

  // Convert ReadonlyRequestCookies to Supabase expected format
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => {
          // Map all cookies to {name, value} format
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
