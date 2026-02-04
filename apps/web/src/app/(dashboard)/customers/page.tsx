// Customers Management Page
// Owner/Staff page for managing customers

'use client';

import { useRouter } from 'next/navigation';
import { CustomerList } from '@/components/customers/customer-list';
import type { CustomerSummary } from '@/lib/customers-api';

export default function CustomersPage() {
  const router = useRouter();

  const handleViewCustomer = (customer: CustomerSummary) => {
    router.push(`/customers/${customer.id}`);
  };

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Gestión de Clientes</h1>
        <p className="text-muted-foreground mt-2">
          Administra los clientes de tu establecimiento
        </p>
      </div>

      {/* Customer List */}
      <CustomerList onViewCustomer={handleViewCustomer} />
    </div>
  );
}
