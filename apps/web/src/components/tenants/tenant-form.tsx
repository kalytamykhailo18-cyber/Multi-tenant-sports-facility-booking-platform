// Tenant Form Component
// Form for creating and editing tenants

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import type { Tenant } from '@/lib/tenants-api';

interface TenantFormProps {
  tenant?: Tenant;
  onSubmit: (data: { businessName: string; slug?: string }) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function TenantForm({
  tenant,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: TenantFormProps) {
  const isEditing = !!tenant;

  // Form state
  const [businessName, setBusinessName] = useState(tenant?.businessName || '');
  const [slug, setSlug] = useState(tenant?.slug || '');
  const [autoSlug, setAutoSlug] = useState(!tenant);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate slug from business name
  useEffect(() => {
    if (autoSlug && businessName) {
      const generatedSlug = businessName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generatedSlug);
    }
  }, [businessName, autoSlug]);

  // Handle slug input (disable auto-generation)
  const handleSlugChange = (value: string) => {
    setAutoSlug(false);
    setSlug(value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validation
    if (!businessName.trim()) {
      setError('El nombre del negocio es requerido');
      return;
    }

    if (businessName.length < 2) {
      setError('El nombre debe tener al menos 2 caracteres');
      return;
    }

    if (slug && (slug.length < 2 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))) {
      setError('El slug debe tener al menos 2 caracteres y solo contener letras minúsculas, números y guiones');
      return;
    }

    setError(null);

    try {
      await onSubmit({
        businessName: businessName.trim(),
        slug: slug || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSubmitting) {
      handleSubmit();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>
            {isEditing ? 'Editar Tenant' : 'Nuevo Tenant'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error message */}
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          {/* Business Name */}
          <div className="space-y-2">
            <Label htmlFor="businessName">Nombre del Negocio *</Label>
            <Input
              id="businessName"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ej: Canchas Los Amigos"
              disabled={isSubmitting}
            />
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="slug">
              Slug (URL)
              {autoSlug && (
                <span className="text-xs text-muted-foreground ml-2">
                  (auto-generado)
                </span>
              )}
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">/</span>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="canchas-los-amigos"
                disabled={isSubmitting}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Solo letras minúsculas, números y guiones
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !businessName.trim()}
          >
            {isSubmitting ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Guardando...
              </>
            ) : (
              isEditing ? 'Guardar' : 'Crear'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
