// Customer Detail Page
// Displays customer profile with all details and management options

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCustomers } from '@/hooks/useCustomers';
import { CustomerProfileHeader } from '@/components/customers/customer-profile-header';
import { CustomerReputationHistory } from '@/components/customers/customer-reputation-history';
import { CustomerNotes } from '@/components/customers/customer-notes';
import { CustomerBookingHistory } from '@/components/customers/customer-booking-history';
import { CustomerForm } from '@/components/customers/customer-form';
import { CustomerBlockDialog } from '@/components/customers/customer-block-dialog';
import { CustomerReputationDialog } from '@/components/customers/customer-reputation-dialog';
import { CustomerCreditDialog } from '@/components/customers/customer-credit-dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { CustomerSummary, UpdateCustomerRequest } from '@/lib/customers-api';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const {
    selectedCustomer,
    loadingCustomer,
    loadingNotes,
    loadingHistory,
    updating,
    blocking,
    updatingReputation,
    addingCredit,
    addingNote,
    error,
    loadCustomer,
    loadNotes,
    loadReputationHistory,
    update,
    setBlocked,
    updateReputation,
    addCredit,
    addNote,
    clearError,
  } = useCustomers();

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showReputationModal, setShowReputationModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);

  // Load customer data on mount
  useEffect(() => {
    if (customerId) {
      loadCustomer(customerId);
      loadNotes(customerId, 10);
      loadReputationHistory(customerId, 10);
    }
  }, [customerId, loadCustomer, loadNotes, loadReputationHistory]);

  // Clear error on unmount
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  // Handlers
  const handleBack = () => {
    router.push('/customers');
  };

  const handleEditSubmit = async (data: UpdateCustomerRequest) => {
    await update(customerId, data);
    setShowEditModal(false);
  };

  const handleBlockSubmit = async (reason?: string) => {
    if (selectedCustomer) {
      await setBlocked(customerId, {
        block: !selectedCustomer.isBlocked,
        reason,
      });
      setShowBlockModal(false);
    }
  };

  const handleReputationSubmit = async (score: number, reason?: string) => {
    await updateReputation(customerId, { score, reason });
    // Reload reputation history
    await loadReputationHistory(customerId, 10);
    setShowReputationModal(false);
  };

  const handleCreditSubmit = async (amount: number, reason?: string) => {
    await addCredit(customerId, { amount, reason });
    setShowCreditModal(false);
  };

  const handleAddNote = async (content: string) => {
    await addNote(customerId, { content });
  };

  const handleLoadMoreNotes = () => {
    loadNotes(customerId, 20);
  };

  const handleLoadMoreHistory = () => {
    loadReputationHistory(customerId, 30);
  };

  // Loading state
  if (loadingCustomer && !selectedCustomer) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error && !selectedCustomer) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
        <Button variant="outline" onClick={handleBack} className="mt-4">
          Volver a la lista
        </Button>
      </div>
    );
  }

  // Not found state
  if (!selectedCustomer) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cliente no encontrado</p>
          <Button variant="outline" onClick={handleBack} className="mt-4">
            Volver a la lista
          </Button>
        </div>
      </div>
    );
  }

  // Create a summary for the block dialog
  const customerSummary: CustomerSummary = {
    id: selectedCustomer.id,
    name: selectedCustomer.name,
    phone: selectedCustomer.phone,
    email: selectedCustomer.email,
    reputationScore: selectedCustomer.reputationScore,
    reputationLevel: selectedCustomer.reputationLevel,
    totalBookings: selectedCustomer.totalBookings,
    noShowCount: selectedCustomer.noShowCount,
    isBlocked: selectedCustomer.isBlocked,
    lastBookingDate: selectedCustomer.lastBookingDate,
  };

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Back button */}
      <Button variant="ghost" onClick={handleBack} className="mb-4">
        ← Volver a clientes
      </Button>

      {/* Error message */}
      {error && (
        <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md mb-4">
          {error}
        </div>
      )}

      {/* Profile header */}
      <CustomerProfileHeader
        customer={selectedCustomer}
        onEdit={() => setShowEditModal(true)}
        onBlock={() => setShowBlockModal(true)}
        onUpdateReputation={() => setShowReputationModal(true)}
        onAddCredit={() => setShowCreditModal(true)}
      />

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Booking history */}
          <CustomerBookingHistory
            customerId={selectedCustomer.id}
            customerPhone={selectedCustomer.phone}
            totalBookings={selectedCustomer.totalBookings}
            completedBookings={selectedCustomer.completedBookings}
            noShowCount={selectedCustomer.noShowCount}
            cancellationCount={selectedCustomer.cancellationCount}
          />

          {/* Notes */}
          <CustomerNotes
            notes={selectedCustomer.recentNotes || []}
            loading={loadingNotes}
            adding={addingNote}
            onAddNote={handleAddNote}
            onLoadMore={handleLoadMoreNotes}
          />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Reputation history */}
          <CustomerReputationHistory
            history={selectedCustomer.reputationHistory || []}
            loading={loadingHistory}
            onLoadMore={handleLoadMoreHistory}
          />
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <CustomerForm
          customer={customerSummary}
          onSubmit={handleEditSubmit}
          onCancel={() => setShowEditModal(false)}
          isSubmitting={updating}
        />
      )}

      {/* Block Modal */}
      {showBlockModal && (
        <CustomerBlockDialog
          customer={customerSummary}
          onConfirm={handleBlockSubmit}
          onCancel={() => setShowBlockModal(false)}
          isSubmitting={blocking}
        />
      )}

      {/* Reputation Modal */}
      {showReputationModal && (
        <CustomerReputationDialog
          customer={selectedCustomer}
          onConfirm={handleReputationSubmit}
          onCancel={() => setShowReputationModal(false)}
          isSubmitting={updatingReputation}
        />
      )}

      {/* Credit Modal */}
      {showCreditModal && (
        <CustomerCreditDialog
          customer={selectedCustomer}
          onConfirm={handleCreditSubmit}
          onCancel={() => setShowCreditModal(false)}
          isSubmitting={addingCredit}
        />
      )}
    </div>
  );
}
