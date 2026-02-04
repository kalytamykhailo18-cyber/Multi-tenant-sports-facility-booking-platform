// Create Match Modal Component
// Form to create a new opponent match request

'use client';

import { useState } from 'react';
import { useOpponentMatch } from '@/hooks/useOpponentMatch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { FiPlus } from 'react-icons/fi';

interface CreateMatchModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateMatchModal({ open, onClose }: CreateMatchModalProps) {
  const { createMatch, createLoading, error } = useOpponentMatch();

  // Placeholder facility ID - in real implementation, get from auth context
  const facilityId = 'facility-id-placeholder';

  const [formData, setFormData] = useState({
    facilityId,
    requestedDate: new Date().toISOString().split('T')[0],
    requestedTime: '20:00',
    courtId: '',
    sportType: 'SOCCER',
    playersNeeded: 2,
    skillLevel: 'ANY',
    notes: '',
  });

  const handleSubmit = async () => {
    try {
      await createMatch({
        ...formData,
        courtId: formData.courtId || undefined,
      });
      onClose();
      // Reset form
      setFormData({
        facilityId,
        requestedDate: new Date().toISOString().split('T')[0],
        requestedTime: '20:00',
        courtId: '',
        sportType: 'SOCCER',
        playersNeeded: 2,
        skillLevel: 'ANY',
        notes: '',
      });
    } catch (err) {
      // Error handled by store
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="rounded-md max-w-md animate-fade-up-normal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FiPlus className="w-5 h-5" />
            Crear Búsqueda de Rival
          </DialogTitle>
          <DialogDescription>
            Publica tu búsqueda y otros jugadores podrán unirse
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Sport Type */}
          <div>
            <label className="text-sm font-medium mb-2 block">Deporte *</label>
            <Select
              value={formData.sportType}
              onValueChange={(value) =>
                setFormData({ ...formData, sportType: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SOCCER">Fútbol</SelectItem>
                <SelectItem value="PADEL">Padel</SelectItem>
                <SelectItem value="TENNIS">Tenis</SelectItem>
                <SelectItem value="MULTI">Multi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div>
            <label className="text-sm font-medium mb-2 block">Fecha *</label>
            <Input
              type="date"
              value={formData.requestedDate}
              onChange={(e) =>
                setFormData({ ...formData, requestedDate: e.target.value })
              }
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Time */}
          <div>
            <label className="text-sm font-medium mb-2 block">Hora *</label>
            <Input
              type="time"
              value={formData.requestedTime}
              onChange={(e) =>
                setFormData({ ...formData, requestedTime: e.target.value })
              }
            />
          </div>

          {/* Players Needed */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Jugadores necesarios *
            </label>
            <Select
              value={formData.playersNeeded.toString()}
              onValueChange={(value) =>
                setFormData({ ...formData, playersNeeded: parseInt(value) })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} {num === 1 ? 'jugador' : 'jugadores'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Skill Level */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Nivel requerido
            </label>
            <Select
              value={formData.skillLevel}
              onValueChange={(value) =>
                setFormData({ ...formData, skillLevel: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ANY">Cualquier nivel</SelectItem>
                <SelectItem value="BEGINNER">Principiante</SelectItem>
                <SelectItem value="INTERMEDIATE">Intermedio</SelectItem>
                <SelectItem value="ADVANCED">Avanzado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Notas adicionales
            </label>
            <Textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Ej: Buscamos 2 jugadores para fútbol 5, nivel intermedio..."
              rows={3}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={createLoading}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={createLoading} className="rounded-md">
              {createLoading ? (
                <>
                  <Spinner className="w-4 h-4 mr-2" />
                  Creando...
                </>
              ) : (
                'Crear Búsqueda'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
