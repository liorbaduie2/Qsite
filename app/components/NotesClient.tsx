"use client";

type Note = {
  id: number;
  title: string;
};

export default function NotesClient({ notes }: { notes: Note[] }) {
  if (!notes.length) return <p>No notes found.</p>;

  return (
    <ul className="space-y-2">
      {notes.map((note) => (
        <li key={note.id} className="p-3 border rounded shadow-sm">
          {note.title}
        </li>
      ))}
    </ul>
  );
}
