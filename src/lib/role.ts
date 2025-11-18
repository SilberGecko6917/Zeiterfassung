/**
 * Represents a user role in the time tracking system.
 */
export enum Role {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  USER = "USER",
}

/**
 * Utility functions for working with roles
 */
export const RoleUtils = {
  /**
   * Checks if the given role has administrative privileges
   */
  isAdmin(role: string | null | undefined): boolean {
    return role === Role.ADMIN;
  },

  /**
   * Checks if the given role has management privileges (Admin or Manager)
   */
  isManager(role: string | null | undefined): boolean {
    return role === Role.MANAGER;
  },
  
  /**
   * Checks if the role is a standard user
   */
  isUser(role: string | null | undefined): boolean {
    return role === Role.USER;
  },

  /**
   * Checks if the role has admin-level access (only admins)
   */
  hasAdminAccess(role: string | null | undefined): boolean {
    return role === Role.ADMIN;
  },
  
  /**
   * Checks if the role has manager-level access (admins and managers)
   */
  hasManagerAccess(role: string | null | undefined): boolean {
    return role === Role.ADMIN || role === Role.MANAGER;
  },

  /**
   * Converts a string to a role enum value
   */
  strToRole(role: string | null | undefined): Role {
    if (!role) return Role.USER;
    
    const normalized = role.toUpperCase();
    switch (normalized) {
      case "ADMIN":
        return Role.ADMIN;
      case "MANAGER":
        return Role.MANAGER;
      case "USER":
        return Role.USER;
      default:
        return Role.USER;
    }
  },
  
  /**
   * Converts a role enum to a human-readable string
   */
  roleToString(role: Role | string): string {
    const roleEnum = typeof role === 'string' ? RoleUtils.strToRole(role) : role;
    
    switch (roleEnum) {
      case Role.ADMIN:
        return "Administrator";
      case Role.MANAGER:
        return "Manager";
      case Role.USER:
        return "Benutzer";
      default:
        return "Benutzer";
    }
  },
};
