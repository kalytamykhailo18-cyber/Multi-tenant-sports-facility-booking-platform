// User Role Constants with display labels
// Used for dropdowns and validation

export const USER_ROLE_LABELS = {
  SUPER_ADMIN: 'Super Administrador',
  OWNER: 'Propietario',
  STAFF: 'Personal',
} as const;

export const USER_ROLE_DESCRIPTIONS = {
  SUPER_ADMIN: 'Control total de la plataforma',
  OWNER: 'Gestiona su propio establecimiento',
  STAFF: 'Acceso limitado a operaciones diarias',
} as const;

export const USER_ROLE_COLORS = {
  SUPER_ADMIN: '#EF4444', // red
  OWNER: '#3B82F6', // blue
  STAFF: '#10B981', // green
} as const;
