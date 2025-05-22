/**
 * Represents a user role in the time tracking system.
 */
export enum Role {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  EMPLOYEE = "USER",
}

/**
 * Utility functions for working with roles
 */
export const RoleUtils = {
  /**
   * Checks if the given role has administrative privileges
   */
  isAdmin(role: Role): boolean {
    return role === Role.ADMIN;
  },

  /**
   * Checks if the given role has management privileges
   */
  isManager(role: Role | null): boolean {
    return role === Role.ADMIN || role === Role.MANAGER;
  },

  /**
   * Converts a string to a role enum value
   */
  strToRole(role: string | null): Role | null {
    if (!role) {
      return null;
    }
    switch (role.toLowerCase()) {
      case "ADMIN":
        return Role.ADMIN;
      case "MANAGER":
        return Role.MANAGER;
      case "USER":
        return Role.EMPLOYEE;
      default:
        return null;
    }
  },
};
