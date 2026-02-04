// Facility Detail Page
// Super Admin page for viewing and managing a single facility

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FacilityStatusBadge } from '@/components/facilities/facility-status-badge';
import { CredentialsStatusDisplay } from '@/components/facilities/credentials-status';
import { CredentialsForm } from '@/components/facilities/credentials-form';
import { QrCodeDisplay } from '@/components/facilities/qr-code-display';
import { FacilityForm } from '@/components/facilities/facility-form';
import { SubscriptionStatusDisplay } from '@/components/subscriptions/subscription-status-display';
import { CourtList } from '@/components/courts/court-list';
import { CourtForm, CourtStatusModal, CourtDeleteModal } from '@/components/courts/court-form';
import { OperatingHoursForm } from '@/components/operating-hours/operating-hours-form';
import { SpecialHoursList } from '@/components/operating-hours/special-hours-list';
import { useFacilities } from '@/hooks/useFacilities';
import { useCourtsByFacility, useCourts } from '@/hooks/useCourts';
import {
  useOperatingHoursByFacility,
  useSpecialHoursByFacility,
  useOperatingHoursForm,
  useSpecialHoursForm,
} from '@/hooks/useOperatingHours';
import type { UpdateFacilityRequest } from '@/lib/facilities-api';
import type { Court, CreateCourtRequest, UpdateCourtRequest, CourtStatus } from '@/lib/courts-api';

export default function FacilityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const facilityId = params.id as string;

  const {
    selectedFacility: facility,
    qrCode,
    loadingFacility: loading,
    updating,
    updatingCredentials,
    generatingQrCode,
    error,
    loadFacility,
    update,
    updateWhatsAppCredentials,
    updateMercadoPagoCredentials,
    updateGeminiCredentials,
    updateWhisperCredentials,
    testCredentials,
    generateQrCode,
    clearError,
  } = useFacilities();

  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'courts' | 'hours' | 'credentials' | 'qrcode' | 'subscription'>('details');

  // Court modal states
  const [showCourtFormModal, setShowCourtFormModal] = useState(false);
  const [showCourtStatusModal, setShowCourtStatusModal] = useState(false);
  const [showCourtDeleteModal, setShowCourtDeleteModal] = useState(false);
  const [editingCourt, setEditingCourt] = useState<Court | undefined>(undefined);
  const [selectedCourtForAction, setSelectedCourtForAction] = useState<Court | null>(null);

  // Courts data
  const { courts, loading: loadingCourts, error: courtsError } = useCourtsByFacility(facilityId);
  const {
    create: createCourt,
    update: updateCourt,
    updateStatus: updateCourtStatus,
    remove: removeCourt,
    creating: creatingCourt,
    updating: updatingCourt,
    deleting: deletingCourt,
    clearError: clearCourtsError,
  } = useCourts();

  // Operating hours data
  const {
    weeklySchedule,
    loading: loadingHours,
    error: hoursError,
  } = useOperatingHoursByFacility(facilityId);
  const {
    specialHours,
    loading: loadingSpecialHours,
  } = useSpecialHoursByFacility(facilityId);
  const {
    submit: submitHours,
    createDefaults: createDefaultHours,
    isSubmitting: isSubmittingHours,
    isCreatingDefaults: isCreatingDefaultHours,
  } = useOperatingHoursForm(facilityId);
  const {
    submit: submitSpecialHours,
    remove: removeSpecialHours,
    isSubmitting: isSubmittingSpecialHours,
    isDeleting: isDeletingSpecialHours,
  } = useSpecialHoursForm();

  // Load facility on mount
  useEffect(() => {
    if (facilityId) {
      loadFacility(facilityId);
    }
  }, [facilityId, loadFacility]);

  const handleEditSubmit = async (data: UpdateFacilityRequest) => {
    await update(facilityId, data);
    setShowEditModal(false);
  };

  const handleGenerateQrCode = async (options?: { message?: string; size?: number }) => {
    await generateQrCode(facilityId, options);
  };

  // Court handlers
  const handleCreateCourt = () => {
    setEditingCourt(undefined);
    setShowCourtFormModal(true);
  };

  const handleEditCourt = (court: Court) => {
    setEditingCourt(court);
    setShowCourtFormModal(true);
  };

  const handleStatusChangeCourt = (court: Court) => {
    setSelectedCourtForAction(court);
    setShowCourtStatusModal(true);
  };

  const handleDeleteCourt = (court: Court) => {
    setSelectedCourtForAction(court);
    setShowCourtDeleteModal(true);
  };

  const handleCourtFormSubmit = async (data: CreateCourtRequest | UpdateCourtRequest) => {
    if (editingCourt) {
      await updateCourt(editingCourt.id, data as UpdateCourtRequest);
    } else {
      await createCourt(data as CreateCourtRequest);
    }
    setShowCourtFormModal(false);
    setEditingCourt(undefined);
  };

  const handleCourtStatusSubmit = async (status: CourtStatus) => {
    if (selectedCourtForAction) {
      await updateCourtStatus(selectedCourtForAction.id, status);
      setShowCourtStatusModal(false);
      setSelectedCourtForAction(null);
    }
  };

  const handleCourtDeleteConfirm = async () => {
    if (selectedCourtForAction) {
      await removeCourt(selectedCourtForAction.id);
      setShowCourtDeleteModal(false);
      setSelectedCourtForAction(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'OWNER']}>
        <div className="container mx-auto py-6 px-4">
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!facility) {
    return (
      <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'OWNER']}>
        <div className="container mx-auto py-6 px-4">
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {error || 'Instalación no encontrada'}
            </p>
            <Button onClick={() => router.push('/facilities')}>
              Volver a Instalaciones
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'OWNER']}>
      <div className="container mx-auto py-6 px-4">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Button
              variant="ghost"
              size="sm"
              className="px-0"
              onClick={() => router.push('/facilities')}
            >
              Instalaciones
            </Button>
            <span>/</span>
            <span>{facility.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                {facility.name}
                <FacilityStatusBadge status={facility.status} />
              </h1>
              <p className="text-muted-foreground mt-1">
                {facility.city}, {facility.country}
              </p>
            </div>
            <Button onClick={() => setShowEditModal(true)}>
              Editar Instalación
            </Button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md mb-6 flex justify-between items-center">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={clearError}>
              Cerrar
            </Button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b overflow-x-auto">
          <Button
            variant={activeTab === 'details' ? 'default' : 'ghost'}
            className="rounded-b-none"
            onClick={() => setActiveTab('details')}
          >
            Detalles
          </Button>
          <Button
            variant={activeTab === 'courts' ? 'default' : 'ghost'}
            className="rounded-b-none"
            onClick={() => setActiveTab('courts')}
          >
            Canchas
          </Button>
          <Button
            variant={activeTab === 'hours' ? 'default' : 'ghost'}
            className="rounded-b-none"
            onClick={() => setActiveTab('hours')}
          >
            Horarios
          </Button>
          <Button
            variant={activeTab === 'credentials' ? 'default' : 'ghost'}
            className="rounded-b-none"
            onClick={() => setActiveTab('credentials')}
          >
            Credenciales API
          </Button>
          <Button
            variant={activeTab === 'qrcode' ? 'default' : 'ghost'}
            className="rounded-b-none"
            onClick={() => setActiveTab('qrcode')}
          >
            Código QR
          </Button>
          <Button
            variant={activeTab === 'subscription' ? 'default' : 'ghost'}
            className="rounded-b-none"
            onClick={() => setActiveTab('subscription')}
          >
            Suscripción
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Información de Contacto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Dirección</p>
                  <p className="font-medium">{facility.address}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Teléfono</p>
                  <p className="font-medium">{facility.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{facility.email}</p>
                </div>
                {facility.whatsappPhone && (
                  <div>
                    <p className="text-sm text-muted-foreground">WhatsApp</p>
                    <p className="font-medium">{facility.whatsappPhone}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Configuración</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Zona Horaria</p>
                    <p className="font-medium">{facility.timezone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Moneda</p>
                    <p className="font-medium">{facility.currencyCode}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Seña</p>
                    <p className="font-medium">{facility.depositPercentage}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cancelación con crédito</p>
                    <p className="font-medium">{facility.cancellationHours}h antes</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Aviso mínimo</p>
                    <p className="font-medium">{facility.minBookingNoticeHours}h</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Máx anticipación</p>
                    <p className="font-medium">{facility.maxBookingAdvanceDays} días</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Buffer entre turnos</p>
                    <p className="font-medium">{facility.bufferMinutes} min</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Duración de turnos</p>
                    <p className="font-medium">
                      {facility.sessionDurationMinutes.join(', ')} min
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Estadísticas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-3xl font-bold">{facility.courtCount ?? 0}</p>
                    <p className="text-sm text-muted-foreground">Canchas</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-3xl font-bold">{facility.depositPercentage}%</p>
                    <p className="text-sm text-muted-foreground">Seña</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Status */}
            <SubscriptionStatusDisplay
              tenantId={facility.tenantId}
              onManageSubscription={() => setActiveTab('subscription')}
            />

            {/* Integrations Status */}
            <Card>
              <CardHeader>
                <CardTitle>Estado de Integraciones</CardTitle>
                <CardDescription>
                  Credenciales de API configuradas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                    <span className="font-medium">WhatsApp Business</span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        facility.credentials?.whatsapp
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {facility.credentials?.whatsapp ? 'Configurado' : 'No configurado'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                    <span className="font-medium">Mercado Pago</span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        facility.credentials?.mercadoPago
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {facility.credentials?.mercadoPago ? 'Configurado' : 'No configurado'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                    <span className="font-medium">Gemini AI</span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        facility.credentials?.gemini
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {facility.credentials?.gemini ? 'Configurado' : 'No configurado'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                    <span className="font-medium">Whisper</span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        facility.credentials?.whisper
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {facility.credentials?.whisper ? 'Configurado' : 'No configurado'}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => setActiveTab('credentials')}
                >
                  Administrar Credenciales
                </Button>
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Información del Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">ID</p>
                    <p className="font-mono text-sm">{facility.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tenant ID</p>
                    <p className="font-mono text-sm">{facility.tenantId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Creada</p>
                    <p className="text-sm">{formatDate(facility.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Última actualización</p>
                    <p className="text-sm">{formatDate(facility.updatedAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'courts' && (
          <div className="space-y-4">
            {/* Courts error message */}
            {courtsError && (
              <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md flex justify-between items-center">
                <span>{courtsError}</span>
                <Button variant="ghost" size="sm" onClick={clearCourtsError}>
                  Cerrar
                </Button>
              </div>
            )}

            <CourtList
              courts={courts}
              loading={loadingCourts}
              error={courtsError}
              emptyMessage="Esta instalación no tiene canchas registradas"
              onEdit={handleEditCourt}
              onDelete={handleDeleteCourt}
              onStatusChange={handleStatusChangeCourt}
              onCreate={handleCreateCourt}
            />
          </div>
        )}

        {activeTab === 'hours' && (
          <div className="space-y-6">
            {/* Hours error message */}
            {hoursError && (
              <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md">
                {hoursError}
              </div>
            )}

            {/* Weekly Operating Hours */}
            {loadingHours ? (
              <div className="flex justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : (
              <OperatingHoursForm
                weeklySchedule={weeklySchedule}
                facilityId={facilityId}
                onSubmit={submitHours}
                onCreateDefaults={createDefaultHours}
                isSubmitting={isSubmittingHours}
                isCreatingDefaults={isCreatingDefaultHours}
              />
            )}

            {/* Special Hours (only show when weekly schedule exists) */}
            {weeklySchedule && (
              <SpecialHoursList
                specialHours={specialHours}
                facilityId={facilityId}
                loading={loadingSpecialHours}
                onCreateSpecialHours={async (data) => {
                  const result = await submitSpecialHours(data);
                  return result;
                }}
                onUpdateSpecialHours={async (id, data) => {
                  const result = await submitSpecialHours({ ...data, id });
                  return result;
                }}
                onDeleteSpecialHours={removeSpecialHours}
                isCreating={isSubmittingSpecialHours}
                isUpdating={isSubmittingSpecialHours}
                isDeleting={isDeletingSpecialHours}
              />
            )}
          </div>
        )}

        {activeTab === 'credentials' && (
          <CredentialsForm
            facility={facility}
            onUpdateWhatsApp={(creds) => updateWhatsAppCredentials(facilityId, creds)}
            onUpdateMercadoPago={(creds) => updateMercadoPagoCredentials(facilityId, creds)}
            onUpdateGemini={(creds) => updateGeminiCredentials(facilityId, creds)}
            onUpdateWhisper={(creds) => updateWhisperCredentials(facilityId, creds)}
            onTestCredentials={(type) => testCredentials(facilityId, type)}
            isUpdating={updatingCredentials}
          />
        )}

        {activeTab === 'qrcode' && (
          <div className="max-w-lg">
            <QrCodeDisplay
              facilityId={facilityId}
              facilityName={facility.name}
              whatsappPhone={facility.whatsappPhone}
              qrCode={qrCode}
              isGenerating={generatingQrCode}
              onGenerate={handleGenerateQrCode}
            />
          </div>
        )}

        {activeTab === 'subscription' && (
          <div className="max-w-lg">
            <SubscriptionStatusDisplay
              tenantId={facility.tenantId}
              onManageSubscription={() => router.push('/subscriptions')}
            />
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <FacilityForm
            facility={facility}
            onSubmit={handleEditSubmit}
            onCancel={() => setShowEditModal(false)}
            isSubmitting={updating}
          />
        )}

        {/* Court Form Modal */}
        {showCourtFormModal && (
          <CourtForm
            court={editingCourt}
            facilityId={facilityId}
            currencyCode={facility.currencyCode}
            onSubmit={handleCourtFormSubmit}
            onCancel={() => {
              setShowCourtFormModal(false);
              setEditingCourt(undefined);
            }}
            isSubmitting={creatingCourt || updatingCourt}
          />
        )}

        {/* Court Status Modal */}
        {showCourtStatusModal && selectedCourtForAction && (
          <CourtStatusModal
            court={selectedCourtForAction}
            onSubmit={handleCourtStatusSubmit}
            onCancel={() => {
              setShowCourtStatusModal(false);
              setSelectedCourtForAction(null);
            }}
            isSubmitting={updatingCourt}
          />
        )}

        {/* Court Delete Modal */}
        {showCourtDeleteModal && selectedCourtForAction && (
          <CourtDeleteModal
            court={selectedCourtForAction}
            onConfirm={handleCourtDeleteConfirm}
            onCancel={() => {
              setShowCourtDeleteModal(false);
              setSelectedCourtForAction(null);
            }}
            isDeleting={deletingCourt}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
