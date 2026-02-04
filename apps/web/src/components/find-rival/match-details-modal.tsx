// Match Details Modal Component
// Shows full match details and allows joining/leaving

'use client';

import { useState } from 'react';
import { useOpponentMatch } from '@/hooks/useOpponentMatch';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import { OpponentMatch } from '@/lib/opponent-match-api';
import {
  FiCalendar,
  FiClock,
  FiUser,
  FiUsers,
  FiMapPin,
  FiTrendingUp,
  FiMessageSquare,
  FiX,
} from 'react-icons/fi';

interface MatchDetailsModalProps {
  open: boolean;
  match: OpponentMatch;
  onClose: () => void;
}

export function MatchDetailsModal({
  open,
  match,
  onClose,
}: MatchDetailsModalProps) {
  const { joinMatch, leaveMatch, cancelMatch, joinLoading, leaveLoading, cancelLoading } =
    useOpponentMatch();
  const { user } = useAuth();

  const [joinNotes, setJoinNotes] = useState('');

  const isCreator = match.customerId === user?.userId;
  const isParticipant = match.joinedPlayers.some((p) => p.id === user?.userId);
  const isFull = match.spotsRemaining === 0;
  const canJoin = !isCreator && !isParticipant && !isFull;
  const canLeave = isParticipant;
  const canCancel = isCreator && match.status === 'OPEN';

  const sportTypeLabels = {
    SOCCER: 'Fútbol',
    PADEL: 'Padel',
    TENNIS: 'Tenis',
    MULTI: 'Multi',
  };

  const skillLevelLabels = {
    BEGINNER: 'Principiante',
    INTERMEDIATE: 'Intermedio',
    ADVANCED: 'Avanzado',
    ANY: 'Cualquier nivel',
  };

  const sportType = sportTypeLabels[match.sportType] || match.sportType;
  const skillLevel = skillLevelLabels[match.skillLevel] || match.skillLevel;

  const handleJoin = async () => {
    try {
      await joinMatch(match.id, { notes: joinNotes });
      setJoinNotes('');
    } catch (err) {
      // Error handled by store
    }
  };

  const handleLeave = async () => {
    try {
      await leaveMatch(match.id);
      onClose();
    } catch (err) {
      // Error handled by store
    }
  };

  const handleCancel = async () => {
    if (
      confirm(
        '¿Estás seguro de cancelar esta búsqueda? Los jugadores que se unieron serán notificados.'
      )
    ) {
      try {
        await cancelMatch(match.id);
        onClose();
      } catch (err) {
        // Error handled by store
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="rounded-md max-w-2xl animate-fade-up-normal max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{sportType}</DialogTitle>
          <DialogDescription>
            Detalles de la búsqueda de rival
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Match Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
              <FiCalendar className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Fecha</p>
                <p className="font-medium">
                  {new Date(match.requestedDate).toLocaleDateString('es-AR')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
              <FiClock className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Hora</p>
                <p className="font-medium">{match.requestedTime} hs</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
              <FiUser className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Creado por</p>
                <p className="font-medium">{match.customerName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
              <FiTrendingUp className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Nivel</p>
                <p className="font-medium">{skillLevel}</p>
              </div>
            </div>

            {match.courtName && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-md md:col-span-2">
                <FiMapPin className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Cancha</p>
                  <p className="font-medium">{match.courtName}</p>
                </div>
              </div>
            )}
          </div>

          {/* Players */}
          <div className="p-4 bg-primary/10 rounded-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FiUsers className="w-5 h-5 text-primary" />
                <span className="font-medium">Jugadores</span>
              </div>
              <span className="text-sm font-medium">
                {match.currentPlayers} / {match.playersNeeded}
              </span>
            </div>

            {match.spotsRemaining > 0 && (
              <p className="text-sm text-green-700 font-medium mb-3">
                {match.spotsRemaining === 1
                  ? '¡Solo queda 1 lugar!'
                  : `${match.spotsRemaining} lugares disponibles`}
              </p>
            )}

            <div className="space-y-2">
              {/* Creator */}
              <div className="flex items-center gap-2 p-2 bg-white rounded">
                <FiUser className="w-4 h-4" />
                <span className="font-medium">{match.customerName}</span>
                <span className="text-xs text-muted-foreground">(Creador)</span>
              </div>

              {/* Joined Players */}
              {match.joinedPlayers.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-2 bg-white rounded"
                >
                  <div className="flex items-center gap-2">
                    <FiUser className="w-4 h-4" />
                    <span>{player.name}</span>
                  </div>
                  {player.notes && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <FiMessageSquare className="w-3 h-3" />
                      <span className="max-w-[150px] truncate">{player.notes}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {match.notes && (
            <div>
              <p className="font-medium mb-2">Notas:</p>
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm">{match.notes}</p>
              </div>
            </div>
          )}

          {/* Join Form (if can join) */}
          {canJoin && (
            <div className="border-t pt-4">
              <label className="text-sm font-medium mb-2 block">
                Mensaje (opcional)
              </label>
              <Textarea
                value={joinNotes}
                onChange={(e) => setJoinNotes(e.target.value)}
                placeholder="Ej: Confirmo, llego 15 min antes..."
                rows={2}
                className="mb-3"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end border-t pt-4">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>

            {canCancel && (
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={cancelLoading}
              >
                {cancelLoading ? (
                  <>
                    <Spinner className="w-4 h-4 mr-2" />
                    Cancelando...
                  </>
                ) : (
                  <>
                    <FiX className="w-4 h-4 mr-2" />
                    Cancelar Búsqueda
                  </>
                )}
              </Button>
            )}

            {canLeave && (
              <Button
                variant="outline"
                onClick={handleLeave}
                disabled={leaveLoading}
              >
                {leaveLoading ? (
                  <>
                    <Spinner className="w-4 h-4 mr-2" />
                    Saliendo...
                  </>
                ) : (
                  'Salir'
                )}
              </Button>
            )}

            {canJoin && (
              <Button onClick={handleJoin} disabled={joinLoading} className="rounded-md">
                {joinLoading ? (
                  <>
                    <Spinner className="w-4 h-4 mr-2" />
                    Uniéndose...
                  </>
                ) : (
                  'Unirse'
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
