// Find a Rival Page
// Opponent matching system for finding players

'use client';

import { useState, useEffect } from 'react';
import { useOpponentMatch } from '@/hooks/useOpponentMatch';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OpponentMatchCard } from '@/components/find-rival/opponent-match-card';
import { CreateMatchModal } from '@/components/find-rival/create-match-modal';
import { MatchDetailsModal } from '@/components/find-rival/match-details-modal';
import { FiUsers, FiPlus, FiFilter } from 'react-icons/fi';

export default function FindRivalPage() {
  const { user } = useAuth();
  const { permissions } = usePermissions();
  const {
    matches,
    loading,
    error,
    fetchMatches,
    setSelectedMatch,
    selectedMatch,
    clearError,
  } = useOpponentMatch();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [sportTypeFilter, setSportTypeFilter] = useState<string>('all');
  const [skillLevelFilter, setSkillLevelFilter] = useState<string>('all');

  // Load matches on mount
  useEffect(() => {
    loadMatches();
  }, [sportTypeFilter, skillLevelFilter]);

  const loadMatches = () => {
    const query: any = { status: 'OPEN' };

    if (sportTypeFilter !== 'all') {
      query.sportType = sportTypeFilter;
    }

    if (skillLevelFilter !== 'all') {
      query.skillLevel = skillLevelFilter;
    }

    fetchMatches(query);
  };

  const handleViewDetails = (matchId: string) => {
    const match = matches.find((m) => m.id === matchId);
    if (match) {
      setSelectedMatch(match);
      setShowDetailsModal(true);
    }
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedMatch(null);
  };

  // Permission check
  if (!permissions.canViewBookings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="animate-fade-up-normal">
          <CardHeader>
            <CardTitle>Acceso Denegado</CardTitle>
            <CardDescription>
              No tienes permisos para acceder a esta sección
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between animate-fade-down-fast">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FiUsers className="w-8 h-8" />
            Buscar Rival
          </h1>
          <p className="text-muted-foreground mt-2">
            Encuentra jugadores para completar tu partido
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="rounded-md animate-zoom-in-fast"
        >
          <FiPlus className="w-4 h-4 mr-2" />
          Crear Búsqueda
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="border-destructive animate-fade-up-fast">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-destructive">{error}</p>
              <Button variant="ghost" size="sm" onClick={clearError}>
                Cerrar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="animate-fade-left-normal">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FiFilter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Deporte</label>
              <Select value={sportTypeFilter} onValueChange={setSportTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los deportes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los deportes</SelectItem>
                  <SelectItem value="SOCCER">Fútbol</SelectItem>
                  <SelectItem value="PADEL">Padel</SelectItem>
                  <SelectItem value="TENNIS">Tenis</SelectItem>
                  <SelectItem value="MULTI">Multi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Nivel</label>
              <Select value={skillLevelFilter} onValueChange={setSkillLevelFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los niveles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los niveles</SelectItem>
                  <SelectItem value="ANY">Cualquier nivel</SelectItem>
                  <SelectItem value="BEGINNER">Principiante</SelectItem>
                  <SelectItem value="INTERMEDIATE">Intermedio</SelectItem>
                  <SelectItem value="ADVANCED">Avanzado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matches List */}
      {loading ? (
        <div className="flex justify-center p-12">
          <Spinner className="w-8 h-8" />
        </div>
      ) : matches.length === 0 ? (
        <Card className="animate-fade-up-slow">
          <CardContent className="pt-6 text-center py-12">
            <FiUsers className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No hay búsquedas activas</h3>
            <p className="text-muted-foreground mt-2">
              Sé el primero en crear una búsqueda de rival
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 rounded-md"
            >
              Crear Búsqueda
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matches.map((match, index) => {
            const animations = [
              'animate-fade-up-fast',
              'animate-fade-down-normal',
              'animate-fade-left-slow',
              'animate-fade-right-light-slow',
              'animate-zoom-in-fast',
              'animate-flip-up-normal',
            ];
            return (
              <OpponentMatchCard
                key={match.id}
                match={match}
                onViewDetails={() => handleViewDetails(match.id)}
                className={animations[index % animations.length]}
              />
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateMatchModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {showDetailsModal && selectedMatch && (
        <MatchDetailsModal
          open={showDetailsModal}
          match={selectedMatch}
          onClose={handleCloseDetailsModal}
        />
      )}
    </div>
  );
}
