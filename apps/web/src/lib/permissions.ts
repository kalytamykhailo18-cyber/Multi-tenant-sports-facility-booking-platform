// Permissions utilities
// Role-based access control helpers

export type UserRole = 'SUPER_ADMIN' | 'OWNER' | 'STAFF';

export interface PermissionConfig {
  // Financial access
  canViewFinances: boolean;
  canExportReports: boolean;
  canViewRevenue: boolean;

  // Facility management
  canEditFacilitySettings: boolean;
  canManageCourts: boolean;
  canManageOperatingHours: boolean;

  // User management
  canManageStaff: boolean;
  canViewAllUsers: boolean;

  // Booking management
  canCreateBookings: boolean;
  canEditBookings: boolean;
  canCancelBookings: boolean;
  canViewBookings: boolean;

  // Customer management
  canViewCustomers: boolean;
  canEditCustomers: boolean;
  canViewCustomerHistory: boolean;
  canManageCustomerCredits: boolean;

  // Payments
  canProcessPayments: boolean;
  canIssueRefunds: boolean;

  // WhatsApp bot
  canConnectWhatsApp: boolean;
  canConfigureBot: boolean;
  canViewBotConversations: boolean;

  // Reports
  canViewReports: boolean;
  canViewDashboard: boolean;
}

/**
 * Get permissions for a specific role
 */
export function getPermissionsForRole(role: UserRole): PermissionConfig {
  switch (role) {
    case 'SUPER_ADMIN':
      return {
        // Super admin can do everything
        canViewFinances: true,
        canExportReports: true,
        canViewRevenue: true,
        canEditFacilitySettings: true,
        canManageCourts: true,
        canManageOperatingHours: true,
        canManageStaff: true,
        canViewAllUsers: true,
        canCreateBookings: true,
        canEditBookings: true,
        canCancelBookings: true,
        canViewBookings: true,
        canViewCustomers: true,
        canEditCustomers: true,
        canViewCustomerHistory: true,
        canManageCustomerCredits: true,
        canProcessPayments: true,
        canIssueRefunds: true,
        canConnectWhatsApp: true,
        canConfigureBot: true,
        canViewBotConversations: true,
        canViewReports: true,
        canViewDashboard: true,
      };

    case 'OWNER':
      return {
        // Owner can do everything in their facility
        canViewFinances: true,
        canExportReports: true,
        canViewRevenue: true,
        canEditFacilitySettings: true,
        canManageCourts: true,
        canManageOperatingHours: true,
        canManageStaff: true,
        canViewAllUsers: true,
        canCreateBookings: true,
        canEditBookings: true,
        canCancelBookings: true,
        canViewBookings: true,
        canViewCustomers: true,
        canEditCustomers: true,
        canViewCustomerHistory: true,
        canManageCustomerCredits: true,
        canProcessPayments: true,
        canIssueRefunds: true,
        canConnectWhatsApp: true,
        canConfigureBot: true,
        canViewBotConversations: true,
        canViewReports: true,
        canViewDashboard: true,
      };

    case 'STAFF':
      return {
        // Staff has limited access
        canViewFinances: false, // ❌ Cannot see finances
        canExportReports: false, // ❌ Cannot export reports
        canViewRevenue: false, // ❌ Cannot see revenue data
        canEditFacilitySettings: false, // ❌ Cannot edit settings
        canManageCourts: false, // ❌ Cannot manage courts
        canManageOperatingHours: false, // ❌ Cannot change hours
        canManageStaff: false, // ❌ Cannot manage other staff
        canViewAllUsers: false, // ❌ Cannot view users
        canCreateBookings: true, // ✅ Can create bookings
        canEditBookings: true, // ✅ Can edit bookings
        canCancelBookings: true, // ✅ Can cancel bookings
        canViewBookings: true, // ✅ Can view bookings
        canViewCustomers: true, // ✅ Can view customers
        canEditCustomers: true, // ✅ Can edit customer info
        canViewCustomerHistory: true, // ✅ Can view booking history
        canManageCustomerCredits: false, // ❌ Cannot manage credits
        canProcessPayments: true, // ✅ Can process payments
        canIssueRefunds: false, // ❌ Cannot issue refunds
        canConnectWhatsApp: false, // ❌ Cannot connect WhatsApp
        canConfigureBot: false, // ❌ Cannot configure bot
        canViewBotConversations: true, // ✅ Can view conversations
        canViewReports: false, // ❌ Cannot view reports
        canViewDashboard: true, // ✅ Can view basic dashboard
      };

    default:
      // Default: no permissions
      return {
        canViewFinances: false,
        canExportReports: false,
        canViewRevenue: false,
        canEditFacilitySettings: false,
        canManageCourts: false,
        canManageOperatingHours: false,
        canManageStaff: false,
        canViewAllUsers: false,
        canCreateBookings: false,
        canEditBookings: false,
        canCancelBookings: false,
        canViewBookings: false,
        canViewCustomers: false,
        canEditCustomers: false,
        canViewCustomerHistory: false,
        canManageCustomerCredits: false,
        canProcessPayments: false,
        canIssueRefunds: false,
        canConnectWhatsApp: false,
        canConfigureBot: false,
        canViewBotConversations: false,
        canViewReports: false,
        canViewDashboard: false,
      };
  }
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(
  role: UserRole | undefined,
  permission: keyof PermissionConfig
): boolean {
  if (!role) return false;
  const permissions = getPermissionsForRole(role);
  return permissions[permission];
}

/**
 * Check if user can access a route
 */
export function canAccessRoute(role: UserRole | undefined, route: string): boolean {
  if (!role) return false;

  const permissions = getPermissionsForRole(role);

  // Route access mapping
  const routePermissions: Record<string, keyof PermissionConfig> = {
    '/finances': 'canViewFinances',
    '/settings': 'canEditFacilitySettings',
    '/staff': 'canManageStaff',
    '/calendar': 'canViewBookings',
    '/customers': 'canViewCustomers',
    '/reports': 'canViewReports',
    '/dashboard': 'canViewDashboard',
  };

  const requiredPermission = routePermissions[route];
  if (!requiredPermission) return true; // Allow access to unmapped routes

  return permissions[requiredPermission];
}
