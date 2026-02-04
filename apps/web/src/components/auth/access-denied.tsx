// Access Denied Component
// Shows when user doesn't have permission to access a route

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { FiAlertCircle, FiArrowLeft } from 'react-icons/fi';

interface AccessDeniedProps {
  title?: string;
  message?: string;
  requiredRole?: string;
  showBackButton?: boolean;
}

export function AccessDenied({
  title = 'Acceso Denegado',
  message = 'No tienes permisos para acceder a esta sección.',
  requiredRole,
  showBackButton = true,
}: AccessDeniedProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="max-w-md w-full animate-fade-up-normal">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-red-100 rounded-full animate-zoom-in-fast">
              <FiAlertCircle className="w-12 h-12 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl animate-fade-down-fast">{title}</CardTitle>
          <CardDescription className="mt-2 animate-fade-up-slow">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {requiredRole && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md animate-fade-left-normal">
              <p className="text-sm text-amber-800">
                <span className="font-medium">Rol requerido:</span> {requiredRole}
              </p>
            </div>
          )}

          {showBackButton && (
            <Button
              onClick={() => router.push('/dashboard')}
              className="w-full rounded-md animate-fade-right-slow"
            >
              <FiArrowLeft className="w-4 h-4 mr-2" />
              Volver al Dashboard
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
