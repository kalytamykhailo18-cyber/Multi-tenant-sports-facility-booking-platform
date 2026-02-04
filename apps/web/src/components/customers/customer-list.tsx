// Customer List Component
// Displays paginated list of customers with search, filters, and view toggle

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCustomers } from '@/hooks/useCustomers';
import { CustomerCard } from './customer-card';
import { CustomerTable } from './customer-table';
import { CustomerForm } from './customer-form';
import { CustomerBlockDialog } from './customer-block-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import type {
  CustomerSummary,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  QueryCustomerParams,
  ReputationLevel,
} from '@/lib/customers-api';

interface CustomerListProps {
  onViewCustomer?: (customer: CustomerSummary) => void;
}

type ViewMode = 'grid' | 'table';

export function CustomerList({ onViewCustomer }: CustomerListProps) {
  const {
    customers,
    pagination,
    filters,
    loading,
    creating,
    updating,
    blocking,
    error,
    loadCustomers,
    create,
    update,
    setBlocked,
    setFilters,
    resetFilters,
    setPage,
    clearError,
  } = useCustomers();

  // Local state
  const [search, setSearch] = useState('');
  const [reputationFilter, setReputationFilter] = useState<ReputationLevel | null>(null);
  const [blockedFilter, setBlockedFilter] = useState<boolean | null>(null);
  const [creditFilter, setCreditFilter] = useState<boolean | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerSummary | null>(null);
  const [blockingCustomer, setBlockingCustomer] = useState<CustomerSummary | null>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters({ search });
    }, 300);
    return () => clearTimeout(timer);
  }, [search, setFilters]);

  // Load customers on filter change
  useEffect(() => {
    loadCustomers();
  }, [loadCustomers, pagination.page, filters]);

  // Clear error on search change
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handlers
  const handleReputationFilterChange = (level: ReputationLevel | null) => {
    setReputationFilter(level);
    setFilters({ reputationLevel: level });
  };

  const handleBlockedFilterChange = (blocked: boolean | null) => {
    setBlockedFilter(blocked);
    setFilters({ isBlocked: blocked });
  };

  const handleCreditFilterChange = (hasCredit: boolean | null) => {
    setCreditFilter(hasCredit);
    setFilters({ hasCredit });
  };

  const handleContactCustomer = (customer: CustomerSummary) => {
    // Open WhatsApp with the customer's phone number
    const phoneNumber = customer.phone.replace(/\D/g, ''); // Remove non-digits
    const whatsappUrl = `https://wa.me/${phoneNumber}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSortChange = (sortBy: QueryCustomerParams['sortBy']) => {
    const newOrder = filters.sortBy === sortBy && filters.sortOrder === 'asc' ? 'desc' : 'asc';
    setFilters({ sortBy, sortOrder: newOrder });
  };

  const handleResetFilters = () => {
    setSearch('');
    setReputationFilter(null);
    setBlockedFilter(null);
    setCreditFilter(null);
    resetFilters();
  };

  const handleCreateSubmit = async (data: CreateCustomerRequest | UpdateCustomerRequest) => {
    await create(data as CreateCustomerRequest);
    setShowCreateModal(false);
  };

  const handleEditSubmit = async (data: CreateCustomerRequest | UpdateCustomerRequest) => {
    if (editingCustomer) {
      await update(editingCustomer.id, data as UpdateCustomerRequest);
      setEditingCustomer(null);
    }
  };

  const handleBlockSubmit = async (reason?: string) => {
    if (blockingCustomer) {
      await setBlocked(blockingCustomer.id, {
        block: !blockingCustomer.isBlocked,
        reason,
      });
      setBlockingCustomer(null);
    }
  };

  const handlePageChange = (page: number) => {
    setPage(page);
  };

  const hasActiveFilters = search || reputationFilter || blockedFilter !== null || creditFilter !== null;

  return (
    <div className="space-y-6">
      {/* Header with search, filters, and create button */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Search */}
          <Input
            placeholder="Buscar por nombre, teléfono o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />

          <div className="flex gap-2">
            {/* View mode toggle */}
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                Tarjetas
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="rounded-l-none"
              >
                Tabla
              </Button>
            </div>

            {/* Create button */}
            <Button onClick={() => setShowCreateModal(true)}>Nuevo Cliente</Button>
          </div>
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-4">
          {/* Reputation filter */}
          <div className="flex gap-2">
            <span className="text-sm text-muted-foreground py-2">Reputación:</span>
            <Button
              variant={reputationFilter === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleReputationFilterChange(null)}
            >
              Todas
            </Button>
            <Button
              variant={reputationFilter === 'GOOD' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleReputationFilterChange('GOOD')}
            >
              Bueno
            </Button>
            <Button
              variant={reputationFilter === 'CAUTION' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleReputationFilterChange('CAUTION')}
            >
              Precaución
            </Button>
            <Button
              variant={reputationFilter === 'POOR' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleReputationFilterChange('POOR')}
            >
              Malo
            </Button>
          </div>

          {/* Blocked filter */}
          <div className="flex gap-2">
            <span className="text-sm text-muted-foreground py-2">Estado:</span>
            <Button
              variant={blockedFilter === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleBlockedFilterChange(null)}
            >
              Todos
            </Button>
            <Button
              variant={blockedFilter === false ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleBlockedFilterChange(false)}
            >
              Activos
            </Button>
            <Button
              variant={blockedFilter === true ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleBlockedFilterChange(true)}
            >
              Bloqueados
            </Button>
          </div>

          {/* Credit filter */}
          <div className="flex gap-2">
            <span className="text-sm text-muted-foreground py-2">Crédito:</span>
            <Button
              variant={creditFilter === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleCreditFilterChange(null)}
            >
              Todos
            </Button>
            <Button
              variant={creditFilter === true ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleCreditFilterChange(true)}
            >
              Con crédito
            </Button>
            <Button
              variant={creditFilter === false ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleCreditFilterChange(false)}
            >
              Sin crédito
            </Button>
          </div>

          {/* Reset filters */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={handleResetFilters}>
              Limpiar filtros
            </Button>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* Customer grid view */}
      {!loading && customers.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              onView={onViewCustomer}
              onContact={handleContactCustomer}
              onEdit={(c) => setEditingCustomer(c)}
              onBlock={(c) => setBlockingCustomer(c)}
            />
          ))}
        </div>
      )}

      {/* Customer table view */}
      {!loading && customers.length > 0 && viewMode === 'table' && (
        <CustomerTable
          customers={customers}
          sortBy={filters.sortBy}
          sortOrder={filters.sortOrder}
          onSort={handleSortChange}
          onView={onViewCustomer}
          onContact={handleContactCustomer}
          onEdit={(c) => setEditingCustomer(c)}
          onBlock={(c) => setBlockingCustomer(c)}
          onRowClick={onViewCustomer}
        />
      )}

      {/* Empty state */}
      {!loading && customers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {hasActiveFilters
              ? 'No se encontraron clientes con los filtros aplicados'
              : 'No hay clientes registrados'}
          </p>
          {!hasActiveFilters && (
            <Button className="mt-4" onClick={() => setShowCreateModal(true)}>
              Crear primer cliente
            </Button>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1 || loading}
          >
            Anterior
          </Button>
          <span className="flex items-center px-4 text-sm">
            Página {pagination.page} de {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages || loading}
          >
            Siguiente
          </Button>
        </div>
      )}

      {/* Results count */}
      {!loading && customers.length > 0 && (
        <p className="text-sm text-center text-muted-foreground">
          Mostrando {customers.length} de {pagination.total} clientes
        </p>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CustomerForm
          onSubmit={handleCreateSubmit}
          onCancel={() => setShowCreateModal(false)}
          isSubmitting={creating}
        />
      )}

      {/* Edit Modal */}
      {editingCustomer && (
        <CustomerForm
          customer={editingCustomer}
          onSubmit={handleEditSubmit}
          onCancel={() => setEditingCustomer(null)}
          isSubmitting={updating}
        />
      )}

      {/* Block Dialog */}
      {blockingCustomer && (
        <CustomerBlockDialog
          customer={blockingCustomer}
          onConfirm={handleBlockSubmit}
          onCancel={() => setBlockingCustomer(null)}
          isSubmitting={blocking}
        />
      )}
    </div>
  );
}
