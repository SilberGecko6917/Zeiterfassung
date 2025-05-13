/**
 * Represents a user role in the time tracking system.
 */
export enum Role {
  ADMIN = "admin",
  MANAGER = "manager",
  EMPLOYEE = "user",
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
      case "admin":
        return Role.ADMIN;
      case "manager":
        return Role.MANAGER;
      case "user":
        return Role.EMPLOYEE;
      default:
        return null;
    }
  },
};
