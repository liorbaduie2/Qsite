"use client";

type Note = { id: number; title: string };

export default function NotesClient({ notes }: { notes: Note[] }) {
  return (
    <ul className="list-disc list-inside">
      {notes.map((note) => (
        <li key={note.id}>{note.title}</li>
      ))}
    </ul>
  );
}
