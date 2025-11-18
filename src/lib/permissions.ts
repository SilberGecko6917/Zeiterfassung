import { Role, RoleUtils } from "./role";

/**
 * Defines what actions each role can perform
 */
export const Permissions = {
  // User Management
  USER_CREATE: [Role.ADMIN] as Role[],
  USER_READ: [Role.ADMIN, Role.MANAGER] as Role[],
  USER_UPDATE: [Role.ADMIN] as Role[],
  USER_DELETE: [Role.ADMIN] as Role[],
  USER_CHANGE_ROLE: [Role.ADMIN] as Role[],

  // Time Entry Management
  TIME_ENTRY_READ_ALL: [Role.ADMIN, Role.MANAGER] as Role[],
  TIME_ENTRY_READ_OWN: [Role.ADMIN, Role.MANAGER, Role.USER] as Role[],
  TIME_ENTRY_CREATE: [Role.ADMIN, Role.MANAGER, Role.USER] as Role[],
  TIME_ENTRY_UPDATE_OWN: [Role.ADMIN, Role.MANAGER, Role.USER] as Role[],
  TIME_ENTRY_UPDATE_ALL: [Role.ADMIN] as Role[],
  TIME_ENTRY_DELETE_OWN: [Role.ADMIN, Role.MANAGER, Role.USER] as Role[],
  TIME_ENTRY_DELETE_ALL: [Role.ADMIN] as Role[],

  // Vacation Management
  VACATION_REQUEST: [Role.ADMIN, Role.MANAGER, Role.USER] as Role[],
  VACATION_APPROVE: [Role.ADMIN, Role.MANAGER] as Role[],
  VACATION_VIEW_ALL: [Role.ADMIN, Role.MANAGER] as Role[],
  VACATION_VIEW_OWN: [Role.ADMIN, Role.MANAGER, Role.USER] as Role[],

  // System Settings
  SETTINGS_VIEW: [Role.ADMIN] as Role[],
  SETTINGS_UPDATE: [Role.ADMIN] as Role[],

  // Reports & Export
  REPORTS_VIEW: [Role.ADMIN, Role.MANAGER] as Role[],
  EXPORT_DATA: [Role.ADMIN, Role.MANAGER] as Role[],

  // Logs
  LOGS_VIEW: [Role.ADMIN] as Role[],

  // Break Settings
  BREAK_SETTINGS_VIEW: [Role.ADMIN] as Role[],
  BREAK_SETTINGS_UPDATE: [Role.ADMIN] as Role[],

  // Dashboard Access
  ADMIN_DASHBOARD: [Role.ADMIN] as Role[],
  MANAGER_DASHBOARD: [Role.ADMIN, Role.MANAGER] as Role[],
};

export type Permission = keyof typeof Permissions;

/**
 * Checks if a role has a specific permission
 */
export function hasPermission(
  userRole: string | null | undefined,
  permission: Permission
): boolean {
  if (!userRole) return false;

  const role = RoleUtils.strToRole(userRole);
  const allowedRoles = Permissions[permission];

  return allowedRoles.includes(role);
}

/**
 * Checks if a role has any of the specified permissions
 */
export function hasAnyPermission(
  userRole: string | null | undefined,
  permissions: Permission[]
): boolean {
  return permissions.some((permission) => hasPermission(userRole, permission));
}

/**
 * Checks if a role has all of the specified permissions
 */
export function hasAllPermissions(
  userRole: string | null | undefined,
  permissions: Permission[]
): boolean {
  return permissions.every((permission) => hasPermission(userRole, permission));
}

/**
 * Gets a human-readable error message for unauthorized access
 */
export function getUnauthorizedMessage(permission: Permission): string {
  return `Sie haben keine Berechtigung für diese Aktion. Erforderliche Berechtigung: ${permission}`;
}
