// Customer Reputation History Component
// Displays reputation change history

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import type { ReputationHistoryEntry } from '@/lib/customers-api';
import { formatDateTime, getReputationChangeLabel } from '@/lib/customers-api';

interface CustomerReputationHistoryProps {
  history: ReputationHistoryEntry[];
  loading?: boolean;
  onLoadMore?: () => void;
}

export function CustomerReputationHistory({
  history,
  loading,
  onLoadMore,
}: CustomerReputationHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Historial de Reputación</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex justify-center py-8">
            <Spinner size="default" />
          </div>
        )}

        {!loading && history.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No hay historial de reputación
          </p>
        )}

        {!loading && history.length > 0 && (
          <div className="space-y-4">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start gap-4 p-3 bg-muted/50 rounded-md"
              >
                {/* Change indicator */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    entry.changeAmount > 0
                      ? 'bg-green-100 text-green-700'
                      : entry.changeAmount < 0
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {entry.changeAmount > 0 ? '+' : ''}
                  {entry.changeAmount}
                </div>

                {/* Details */}
                <div className="flex-1">
                  <p className="font-medium">{getReputationChangeLabel(entry.changeType)}</p>
                  <p className="text-sm text-muted-foreground">
                    {entry.previousScore} → {entry.newScore} puntos
                  </p>
                  {entry.reason && (
                    <p className="text-sm text-muted-foreground mt-1">{entry.reason}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDateTime(entry.createdAt)}
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
