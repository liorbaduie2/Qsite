import NotesServer from "./server/NotesServer";

export default function Page() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-6">My Notes</h1>
      <NotesServer />
    </main>
  );
}
