// Permissions Demo Page
// Demonstrates the role-based access control system

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { FiCheck, FiX, FiShield, FiUser, FiAlertCircle } from 'react-icons/fi';
import { Badge } from '@/components/ui/badge';

export default function PermissionsDemoPage() {
  const { user } = useAuth();
  const { permissions, role, isOwner, isSuperAdmin, isStaff, isAdminOrOwner } = usePermissions();

  const permissionList: Array<{ key: keyof typeof permissions; label: string; category: string }> = [
    { key: 'canViewFinances', label: 'Ver Finanzas', category: 'Financiero' },
    { key: 'canExportReports', label: 'Exportar Reportes', category: 'Financiero' },
    { key: 'canViewRevenue', label: 'Ver Ingresos', category: 'Financiero' },
    { key: 'canEditFacilitySettings', label: 'Editar Configuración', category: 'Administración' },
    { key: 'canManageCourts', label: 'Gestionar Canchas', category: 'Administración' },
    { key: 'canManageOperatingHours', label: 'Gestionar Horarios', category: 'Administración' },
    { key: 'canManageStaff', label: 'Gestionar Personal', category: 'Administración' },
    { key: 'canViewAllUsers', label: 'Ver Todos los Usuarios', category: 'Administración' },
    { key: 'canCreateBookings', label: 'Crear Reservas', category: 'Operaciones' },
    { key: 'canEditBookings', label: 'Editar Reservas', category: 'Operaciones' },
    { key: 'canCancelBookings', label: 'Cancelar Reservas', category: 'Operaciones' },
    { key: 'canViewBookings', label: 'Ver Reservas', category: 'Operaciones' },
    { key: 'canViewCustomers', label: 'Ver Clientes', category: 'Operaciones' },
    { key: 'canEditCustomers', label: 'Editar Clientes', category: 'Operaciones' },
    { key: 'canViewCustomerHistory', label: 'Ver Historial de Clientes', category: 'Operaciones' },
    { key: 'canManageCustomerCredits', label: 'Gestionar Créditos', category: 'Operaciones' },
    { key: 'canProcessPayments', label: 'Procesar Pagos', category: 'Pagos' },
    { key: 'canIssueRefunds', label: 'Emitir Reembolsos', category: 'Pagos' },
    { key: 'canConnectWhatsApp', label: 'Conectar WhatsApp', category: 'WhatsApp' },
    { key: 'canConfigureBot', label: 'Configurar Bot', category: 'WhatsApp' },
    { key: 'canViewBotConversations', label: 'Ver Conversaciones', category: 'WhatsApp' },
    { key: 'canViewReports', label: 'Ver Reportes', category: 'Reportes' },
    { key: 'canViewDashboard', label: 'Ver Dashboard', category: 'General' },
  ];

  const categories = Array.from(new Set(permissionList.map(p => p.category)));

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="animate-fade-down-fast">
        <h1 className="text-3xl font-bold">Sistema de Permisos</h1>
        <p className="text-muted-foreground mt-2">
          Demostración del control de acceso basado en roles
        </p>
      </div>

      {/* User Info Card */}
      <Card className="animate-fade-up-normal">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FiUser className="w-5 h-5" />
                Información del Usuario
              </CardTitle>
              <CardDescription className="mt-2">
                Tu rol determina qué funcionalidades puedes acceder
              </CardDescription>
            </div>
            <Badge variant={isAdminOrOwner ? 'default' : 'secondary'} className="text-sm px-3 py-1">
              {role}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">Nombre</p>
              <p className="font-medium mt-1">{user?.fullName}</p>
            </div>
            <div className="p-4 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium mt-1">{user?.email}</p>
            </div>
            <div className="p-4 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">Tipo de Usuario</p>
              <p className="font-medium mt-1">
                {isSuperAdmin && 'Super Administrador'}
                {isOwner && 'Propietario'}
                {isStaff && 'Personal'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Notice */}
      {isStaff && (
        <Card className="border-blue-200 bg-blue-50 animate-fade-left-slow">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <FiAlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">Acceso de Personal</p>
                <p className="text-sm text-blue-700 mt-1">
                  Como personal, tienes acceso a funciones operativas pero no a datos financieros o configuración del sistema.
                  Esto protege la información sensible del negocio.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Permissions by Category */}
      <div className="grid gap-6">
        {categories.map((category, idx) => {
          const categoryPermissions = permissionList.filter(p => p.category === category);
          const grantedCount = categoryPermissions.filter(p => permissions[p.key]).length;
          const totalCount = categoryPermissions.length;

          const animations = [
            'animate-fade-up-fast',
            'animate-fade-down-normal',
            'animate-fade-left-slow',
            'animate-fade-right-light-slow',
            'animate-zoom-in-fast',
            'animate-flip-up-normal',
          ];

          return (
            <Card key={category} className={animations[idx % animations.length]}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FiShield className="w-5 h-5" />
                      {category}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {grantedCount} de {totalCount} permisos otorgados
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      {Math.round((grantedCount / totalCount) * 100)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Acceso</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categoryPermissions.map((perm) => (
                    <div
                      key={perm.key}
                      className={`flex items-center gap-2 p-3 rounded-md border ${
                        permissions[perm.key]
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      {permissions[perm.key] ? (
                        <FiCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <FiX className="w-4 h-4 text-red-600 flex-shrink-0" />
                      )}
                      <span
                        className={`text-sm ${
                          permissions[perm.key] ? 'text-green-900' : 'text-red-900'
                        }`}
                      >
                        {perm.label}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
