// Booking Modal Component
// Modal for viewing, creating, and editing bookings

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { PaymentLinkSection } from '@/components/payments/payment-link-section';
import {
  type Booking,
  type TimeSlot,
  type CreateBookingRequest,
  type UpdateBookingRequest,
  type BookingStatus,
  getBookingStatusLabel,
  getBookingStatusVariant,
  formatTime,
  formatPrice,
  canCancelBooking,
  canCompleteBooking,
  canMarkNoShow,
} from '@/lib/bookings-api';
import {
  useBookingModal,
  useBookingForm,
  useBookingCancellation,
  useBookingQuickActions,
  useSlotLock,
} from '@/hooks/useBookings';
import { AiOutlineUser, AiOutlineCreditCard } from 'react-icons/ai';

type ModalMode = 'view' | 'create' | 'edit';
type ViewTab = 'details' | 'payments';

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  mode: ModalMode;
  // For view/edit mode
  booking?: Booking | null;
  // For create mode
  slot?: TimeSlot | null;
  courtName?: string;
  facilityName?: string;
  date?: string;
  // Actions
  onSave?: (data: CreateBookingRequest | UpdateBookingRequest) => Promise<void>;
  onCancel?: (reason?: string) => Promise<void>;
  onComplete?: () => Promise<void>;
  onNoShow?: () => Promise<void>;
  onConfirm?: () => Promise<void>;
  // Loading states
  isSaving?: boolean;
  isCancelling?: boolean;
  isUpdating?: boolean;
  // Config
  currencyCode?: string;
  depositPercentage?: number;
}

interface FormData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  notes: string;
  durationMinutes: number;
  depositPaid: boolean;
  fullyPaid: boolean;
}

const initialFormData: FormData = {
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  notes: '',
  durationMinutes: 60,
  depositPaid: false,
  fullyPaid: false,
};

export function BookingModal({
  open,
  onClose,
  mode,
  booking,
  slot,
  courtName,
  facilityName,
  date,
  onSave,
  onCancel,
  onComplete,
  onNoShow,
  onConfirm,
  isSaving = false,
  isCancelling = false,
  isUpdating = false,
  currencyCode = 'ARS',
  depositPercentage = 50,
}: BookingModalProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [cancellationReason, setCancellationReason] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [activeTab, setActiveTab] = useState<ViewTab>('details');

  // Initialize form data when modal opens
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && booking) {
        setFormData({
          customerName: booking.customerName,
          customerPhone: booking.customerPhone,
          customerEmail: booking.customerEmail || '',
          notes: booking.notes || '',
          durationMinutes: booking.durationMinutes,
          depositPaid: booking.depositPaid,
          fullyPaid: booking.balancePaid,
        });
      } else if (mode === 'create') {
        setFormData({
          ...initialFormData,
          durationMinutes: slot?.durationMinutes || 60,
        });
      }
      setErrors({});
      setShowCancelDialog(false);
      setCancellationReason('');
      setActiveTab('details');
    }
  }, [open, mode, booking, slot]);

  // Calculate price based on duration
  const calculatedPrice = useMemo(() => {
    if (slot?.price && formData.durationMinutes) {
      // slot.price is for slot.durationMinutes, recalculate if different
      const pricePerMinute = slot.price / slot.durationMinutes;
      return pricePerMinute * formData.durationMinutes;
    }
    return booking?.totalPrice || 0;
  }, [slot, formData.durationMinutes, booking]);

  const calculatedDeposit = useMemo(() => {
    return (calculatedPrice * depositPercentage) / 100;
  }, [calculatedPrice, depositPercentage]);

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'El nombre es requerido';
    }

    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = 'El teléfono es requerido';
    } else if (!/^\+?[\d\s-]{8,}$/.test(formData.customerPhone.trim())) {
      newErrors.customerPhone = 'Formato de teléfono inválido';
    }

    if (formData.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
      newErrors.customerEmail = 'Formato de email inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (mode === 'create' && slot && onSave) {
      const createData: CreateBookingRequest = {
        courtId: slot.courtId,
        date: slot.date,
        startTime: slot.startTime,
        durationMinutes: formData.durationMinutes,
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim(),
        customerEmail: formData.customerEmail.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        depositPaid: formData.depositPaid,
        fullyPaid: formData.fullyPaid,
      };
      await onSave(createData);
    } else if (mode === 'edit' && booking && onSave) {
      const updateData: UpdateBookingRequest = {
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim(),
        customerEmail: formData.customerEmail.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        depositPaid: formData.depositPaid,
        balancePaid: formData.fullyPaid,
      };
      await onSave(updateData);
    }
  };

  // Handle cancel booking
  const handleCancelBooking = async () => {
    if (onCancel) {
      await onCancel(cancellationReason.trim() || undefined);
      setShowCancelDialog(false);
    }
  };

  const isLoading = isSaving || isCancelling || isUpdating;

  // Get display info
  const displayDate = date || booking?.date?.toString().split('T')[0] || slot?.date;
  const displayCourtName = courtName || booking?.courtName || slot?.courtName;
  const displayStartTime = booking?.startTime || slot?.startTime;
  const displayEndTime = booking?.endTime || (slot ? calculateEndTime(slot.startTime, formData.durationMinutes) : undefined);

  return (
    <Dialog open={open} onClose={onClose} size="lg">
      <DialogHeader onClose={onClose}>
        <DialogTitle>
          {mode === 'view' && 'Detalle de Reserva'}
          {mode === 'create' && 'Nueva Reserva'}
          {mode === 'edit' && 'Editar Reserva'}
        </DialogTitle>
      </DialogHeader>

      <DialogContent>
        {/* Booking/Slot Info */}
        <div className="mb-6 p-4 bg-muted rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Cancha:</span>
              <p className="font-medium">{displayCourtName || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Fecha:</span>
              <p className="font-medium">
                {displayDate
                  ? new Date(displayDate + 'T00:00:00').toLocaleDateString('es-AR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : '-'}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Horario:</span>
              <p className="font-medium">
                {displayStartTime && displayEndTime
                  ? `${formatTime(displayStartTime)} - ${formatTime(displayEndTime)}`
                  : '-'}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Precio:</span>
              <p className="font-medium">{formatPrice(calculatedPrice, currencyCode)}</p>
            </div>
          </div>

          {/* Status badge for view mode */}
          {mode === 'view' && booking && (
            <div className="mt-3 pt-3 border-t">
              <Badge variant={getBookingStatusVariant(booking.status) as "default" | "secondary" | "destructive" | "outline"}>
                {getBookingStatusLabel(booking.status)}
              </Badge>
            </div>
          )}
        </div>

        {/* Form for create/edit */}
        {(mode === 'create' || mode === 'edit') && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Nombre del cliente *</Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="Juan Pérez"
                  disabled={isLoading}
                  className={errors.customerName ? 'border-destructive' : ''}
                />
                {errors.customerName && (
                  <p className="text-xs text-destructive mt-1">{errors.customerName}</p>
                )}
              </div>

              <div>
                <Label htmlFor="customerPhone">Teléfono (WhatsApp) *</Label>
                <Input
                  id="customerPhone"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  placeholder="+54 9 11 5555-1234"
                  disabled={isLoading}
                  className={errors.customerPhone ? 'border-destructive' : ''}
                />
                {errors.customerPhone && (
                  <p className="text-xs text-destructive mt-1">{errors.customerPhone}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="customerEmail">Email (opcional)</Label>
              <Input
                id="customerEmail"
                type="email"
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                placeholder="juan@ejemplo.com"
                disabled={isLoading}
                className={errors.customerEmail ? 'border-destructive' : ''}
              />
              {errors.customerEmail && (
                <p className="text-xs text-destructive mt-1">{errors.customerEmail}</p>
              )}
            </div>

            <div>
              <Label htmlFor="notes">Notas internas (opcional)</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Cliente VIP, prefiere cancha cubierta..."
                disabled={isLoading}
              />
            </div>

            {/* Duration selector for create mode */}
            {mode === 'create' && (
              <div>
                <Label>Duración</Label>
                <div className="flex gap-2 mt-1">
                  {[60, 90, 120].map((duration) => (
                    <Button
                      key={duration}
                      type="button"
                      variant={formData.durationMinutes === duration ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFormData({ ...formData, durationMinutes: duration })}
                      disabled={isLoading}
                    >
                      {duration} min
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Payment status */}
            <div className="p-4 bg-muted rounded-lg">
              <Label className="mb-2 block">Estado de pago</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    Seña ({depositPercentage}%): {formatPrice(calculatedDeposit, currencyCode)}
                  </span>
                  <Button
                    type="button"
                    variant={formData.depositPaid ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormData({ ...formData, depositPaid: !formData.depositPaid })}
                    disabled={isLoading || formData.fullyPaid}
                  >
                    {formData.depositPaid ? 'Pagado' : 'Marcar pagado'}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    Saldo: {formatPrice(calculatedPrice - calculatedDeposit, currencyCode)}
                  </span>
                  <Button
                    type="button"
                    variant={formData.fullyPaid ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormData({
                      ...formData,
                      fullyPaid: !formData.fullyPaid,
                      depositPaid: !formData.fullyPaid ? true : formData.depositPaid,
                    })}
                    disabled={isLoading}
                  >
                    {formData.fullyPaid ? 'Pagado' : 'Marcar pagado'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View mode - customer details and payments */}
        {mode === 'view' && booking && (
          <div className="space-y-4">
            {/* Tab buttons */}
            <div className="flex border-b">
              <button
                type="button"
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'details'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setActiveTab('details')}
              >
                <AiOutlineUser className="w-4 h-4" />
                Detalles
              </button>
              <button
                type="button"
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'payments'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setActiveTab('payments')}
              >
                <AiOutlineCreditCard className="w-4 h-4" />
                Pagos
                {(!booking.depositPaid || !booking.balancePaid) && (
                  <span className="ml-1 w-2 h-2 rounded-full bg-yellow-500" />
                )}
              </button>
            </div>

            {/* Details tab */}
            {activeTab === 'details' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Cliente</Label>
                    <p className="font-medium">{booking.customerName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Teléfono</Label>
                    <p className="font-medium">{booking.customerPhone}</p>
                  </div>
                  {booking.customerEmail && (
                    <div>
                      <Label className="text-muted-foreground">Email</Label>
                      <p className="font-medium">{booking.customerEmail}</p>
                    </div>
                  )}
                  {booking.notes && (
                    <div className="md:col-span-2">
                      <Label className="text-muted-foreground">Notas</Label>
                      <p className="font-medium">{booking.notes}</p>
                    </div>
                  )}
                </div>

                {/* Payment summary */}
                <div className="p-4 bg-muted rounded-lg">
                  <Label className="mb-2 block text-muted-foreground">Resumen de pago</Label>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total:</span>
                      <p className="font-medium">{formatPrice(booking.totalPrice, currencyCode)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Seña:</span>
                      <p className="font-medium">
                        {formatPrice(booking.depositAmount, currencyCode)}
                        <span className={booking.depositPaid ? 'text-green-600 ml-1' : 'text-yellow-600 ml-1'}>
                          ({booking.depositPaid ? 'Pagada' : 'Pendiente'})
                        </span>
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Saldo:</span>
                      <p className="font-medium">
                        {formatPrice(booking.balanceAmount, currencyCode)}
                        <span className={booking.balancePaid ? 'text-green-600 ml-1' : 'text-yellow-600 ml-1'}>
                          ({booking.balancePaid ? 'Pagado' : 'Pendiente'})
                        </span>
                      </p>
                    </div>
                  </div>
                  {(!booking.depositPaid || !booking.balancePaid) && (
                    <Button
                      variant="link"
                      size="sm"
                      className="mt-2 h-auto p-0"
                      onClick={() => setActiveTab('payments')}
                    >
                      Gestionar pagos
                    </Button>
                  )}
                </div>

                {/* Quick actions for view mode */}
                {(canCompleteBooking(booking) || canMarkNoShow(booking)) && (
                  <div className="flex flex-wrap gap-2">
                    {booking.status === 'PAID' && onConfirm && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onConfirm}
                        disabled={isLoading}
                      >
                        {isUpdating ? <Spinner className="w-4 h-4 mr-2" /> : null}
                        Marcar confirmado
                      </Button>
                    )}
                    {canCompleteBooking(booking) && onComplete && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onComplete}
                        disabled={isLoading}
                      >
                        {isUpdating ? <Spinner className="w-4 h-4 mr-2" /> : null}
                        Marcar completado
                      </Button>
                    )}
                    {canMarkNoShow(booking) && onNoShow && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onNoShow}
                        disabled={isLoading}
                        className="text-orange-600"
                      >
                        {isUpdating ? <Spinner className="w-4 h-4 mr-2" /> : null}
                        Marcar no-show
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Payments tab */}
            {activeTab === 'payments' && (
              <PaymentLinkSection
                bookingId={booking.id}
                totalPrice={booking.totalPrice}
                depositAmount={booking.depositAmount}
                depositPaid={booking.depositPaid}
                balancePaid={booking.balancePaid}
                currencyCode={currencyCode}
                customerEmail={booking.customerEmail || undefined}
                customerName={booking.customerName}
              />
            )}
          </div>
        )}

        {/* Cancel confirmation */}
        {showCancelDialog && (
          <div className="mt-6 p-4 border border-destructive rounded-lg">
            <h4 className="font-medium text-destructive mb-2">Cancelar reserva</h4>
            <Input
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="Motivo de la cancelación (opcional)"
              className="mb-3"
            />
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleCancelBooking}
                disabled={isLoading}
              >
                {isCancelling ? <Spinner className="w-4 h-4 mr-2" /> : null}
                Confirmar cancelación
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelDialog(false)}
                disabled={isLoading}
              >
                No, mantener
              </Button>
            </div>
          </div>
        )}
      </DialogContent>

      <DialogFooter>
        {/* View mode buttons */}
        {mode === 'view' && booking && !showCancelDialog && (
          <>
            {canCancelBooking(booking) && onCancel && (
              <Button
                variant="outline"
                onClick={() => setShowCancelDialog(true)}
                disabled={isLoading}
                className="text-destructive"
              >
                Cancelar reserva
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </>
        )}

        {/* Create/Edit mode buttons */}
        {(mode === 'create' || mode === 'edit') && (
          <>
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isSaving ? <Spinner className="w-4 h-4 mr-2" /> : null}
              {mode === 'create' ? 'Crear reserva' : 'Guardar cambios'}
            </Button>
          </>
        )}
      </DialogFooter>
    </Dialog>
  );
}

// Helper function to calculate end time
function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
}

// ============================================
// Connected Booking Modal
// Connects to UI store and booking hooks for state management
// ============================================

interface ConnectedBookingModalProps {
  /** Called after successful booking creation */
  onBookingCreated?: (booking: Booking) => void;
  /** Called after successful booking update */
  onBookingUpdated?: (booking: Booking) => void;
  /** Called after booking cancellation */
  onBookingCancelled?: (bookingId: string) => void;
  /** Called to refresh calendar data */
  onRefresh?: () => void;
}

export function ConnectedBookingModal({
  onBookingCreated,
  onBookingUpdated,
  onBookingCancelled,
  onRefresh,
}: ConnectedBookingModalProps) {
  // Modal state from UI store
  const {
    isOpen,
    mode,
    booking,
    slot,
    courtName,
    facilityName,
    date,
    currencyCode,
    depositPercentage,
    closeModal,
  } = useBookingModal();

  // Booking operations
  const { submit: submitBooking, isSubmitting, error: formError, clearError: clearFormError } = useBookingForm();
  const { cancel: cancelBooking, isCancelling } = useBookingCancellation();
  const { markCompleted, markNoShow, markConfirmed, isUpdating } = useBookingQuickActions();
  const { unlockSlot, hasLock } = useSlotLock();

  // Handle modal close with slot unlock
  const handleClose = useCallback(async () => {
    // Release slot lock if we have one and closing without completing booking
    if (hasLock && mode === 'create') {
      try {
        await unlockSlot();
      } catch (error) {
        console.warn('Failed to release slot lock:', error);
      }
    }
    clearFormError();
    closeModal();
  }, [hasLock, mode, unlockSlot, clearFormError, closeModal]);

  // Handle booking save
  const handleSave = useCallback(async (data: CreateBookingRequest | UpdateBookingRequest) => {
    try {
      if (mode === 'create') {
        const newBooking = await submitBooking(data as CreateBookingRequest);
        onBookingCreated?.(newBooking);
      } else if (mode === 'edit' && booking) {
        const updatedBooking = await submitBooking({ ...data, id: booking.id } as UpdateBookingRequest & { id: string });
        onBookingUpdated?.(updatedBooking);
      }
      closeModal();
      onRefresh?.();
    } catch (error) {
      // Error is already handled in the store
      console.error('Booking save error:', error);
    }
  }, [mode, booking, submitBooking, onBookingCreated, onBookingUpdated, closeModal, onRefresh]);

  // Handle booking cancellation
  const handleCancel = useCallback(async (reason?: string) => {
    if (!booking) return;
    try {
      await cancelBooking(booking.id, reason);
      onBookingCancelled?.(booking.id);
      closeModal();
      onRefresh?.();
    } catch (error) {
      console.error('Booking cancellation error:', error);
    }
  }, [booking, cancelBooking, onBookingCancelled, closeModal, onRefresh]);

  // Handle quick actions
  const handleComplete = useCallback(async () => {
    if (!booking) return;
    try {
      await markCompleted(booking.id);
      closeModal();
      onRefresh?.();
    } catch (error) {
      console.error('Mark completed error:', error);
    }
  }, [booking, markCompleted, closeModal, onRefresh]);

  const handleNoShow = useCallback(async () => {
    if (!booking) return;
    try {
      await markNoShow(booking.id);
      closeModal();
      onRefresh?.();
    } catch (error) {
      console.error('Mark no-show error:', error);
    }
  }, [booking, markNoShow, closeModal, onRefresh]);

  const handleConfirm = useCallback(async () => {
    if (!booking) return;
    try {
      await markConfirmed(booking.id);
      closeModal();
      onRefresh?.();
    } catch (error) {
      console.error('Mark confirmed error:', error);
    }
  }, [booking, markConfirmed, closeModal, onRefresh]);

  return (
    <BookingModal
      open={isOpen}
      onClose={handleClose}
      mode={mode}
      booking={booking}
      slot={slot}
      courtName={courtName}
      facilityName={facilityName}
      date={date}
      onSave={handleSave}
      onCancel={handleCancel}
      onComplete={handleComplete}
      onNoShow={handleNoShow}
      onConfirm={handleConfirm}
      isSaving={isSubmitting}
      isCancelling={isCancelling}
      isUpdating={isUpdating}
      currencyCode={currencyCode}
      depositPercentage={depositPercentage}
    />
  );
}
