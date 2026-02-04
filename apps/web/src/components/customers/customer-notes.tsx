// Customer Notes Component
// Displays and allows adding customer notes

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import type { CustomerNote } from '@/lib/customers-api';
import { formatDateTime } from '@/lib/customers-api';

interface CustomerNotesProps {
  notes: CustomerNote[];
  loading?: boolean;
  adding?: boolean;
  onAddNote: (content: string) => Promise<void>;
  onLoadMore?: () => void;
}

export function CustomerNotes({
  notes,
  loading,
  adding,
  onAddNote,
  onLoadMore,
}: CustomerNotesProps) {
  const [newNote, setNewNote] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newNote.trim()) {
      setError('El contenido de la nota es requerido');
      return;
    }

    try {
      await onAddNote(newNote.trim());
      setNewNote('');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agregar nota');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Notas</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Add note form */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-2">
            <Input
              placeholder="Agregar una nota..."
              value={newNote}
              onChange={(e) => {
                setNewNote(e.target.value);
                setError('');
              }}
              disabled={adding}
              className={error ? 'border-destructive' : ''}
            />
            <Button type="submit" disabled={adding || !newNote.trim()}>
              {adding ? <Spinner size="sm" /> : 'Agregar'}
            </Button>
          </div>
          {error && <p className="text-sm text-destructive mt-1">{error}</p>}
        </form>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center py-8">
            <Spinner size="default" />
          </div>
        )}

        {/* Empty state */}
        {!loading && notes.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No hay notas para este cliente
          </p>
        )}

        {/* Notes list */}
        {!loading && notes.length > 0 && (
          <div className="space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="p-3 bg-muted/50 rounded-md">
                <p className="text-sm">{note.content}</p>
                <div className="flex justify-between items-center mt-2">
                  {note.createdByName && (
                    <p className="text-xs text-muted-foreground">
                      Por: {note.createdByName}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(note.createdAt)}
                  </p>
                </div>
              </div>
            ))}

            {onLoadMore && (
              <div className="text-center pt-4">
                <button
                  className="text-sm text-primary hover:underline"
                  onClick={onLoadMore}
                >
                  Cargar más
                </button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
