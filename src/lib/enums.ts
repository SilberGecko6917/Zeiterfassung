/**
 * Enum representing different log actions that can be tracked in the application.
 */
export enum LogAction {
  /**
   * User logged in to the application
   */
  LOGIN = "LOGIN",

  /**
   * User logged out from the application
   */
  LOGOUT = "LOGOUT",

  /**
   * Data was created
   */
  CREATE = "CREATE",

  /**
   * Data was read or retrieved
   */
  READ = "READ",

  /**
   * Data was updated
   */
  UPDATE = "UPDATE",

  /**
   * Data was deleted
   */
  DELETE = "DELETE",

  /**
   * System configuration was changed
   */
  CONFIG_CHANGE = "CONFIG_CHANGE",

  /**
   * An export operation was performed
   */
  EXPORT = "EXPORT",

  /**
   * A user permission was modified
   */
  PERMISSION_CHANGE = "PERMISSION_CHANGE",

  /**
   * A user was created
   */
  USER_CREATE = "USER_CREATE",

  /**
   * A user was updated
   */
  USER_UPDATE = "USER_UPDATE",

  /**
   * A user was deleted
   */
  USER_DELETE = "USER_DELETE",

  /**
   * A password was changed
   */
  PASSWORD_CHANGE = "PASSWORD_CHANGE",

  /**
   * Installation was completed
   */
  INSTALLATION_COMPLETE = "INSTALLATION_COMPLETE",

  /**
   * Installation was started
   */
  INSTALLATION_START = "INSTALLATION_START",

  /**
   * Installation database check
   */
  INSTALLATION_DATABASE_CHECK = "INSTALLATION_DATABASE_CHECK",

  /**
   * Installation admin account created
   */
  INSTALLATION_CREATED_ADMIN = "INSTALLATION_CREATED_ADMIN",

  /**
   * Start tracking time
   */
  START_TRACKING = "START_TRACKING",

  /**
   * Stop tracking time
   */
  STOP_TRACKING = "STOP_TRACKING",

  /**
   * Automatic break was added
   */
  AUTO_BREAK_ADDED = "AUTO_BREAK_ADDED",
  BREAKS_PROCESSED = "BREAKS_PROCESSED",
}

/**
 * Enum representing different entities that can be logged in the application.
 */
export enum LogEntity {
  /**
   * User entity
   */
  USER = "USER",

  /**
   * Role entity
   */
  ROLE = "ROLE",

  /**
   * Permission entity
   */
  PERMISSION = "PERMISSION",

  /**
   * Configuration entity
   */
  CONFIGURATION = "CONFIGURATION",

  /**
   * Installation entity
   */
  INSTALLATION = "INSTALLATION",

  /**
   * Export entity
   */
  EXPORT = "EXPORT",

  /**
   * Time entry entity
   */
  TIME_ENTRY = "TIME_ENTRY",

  /**
   * Break entity
   */
  BREAK = "BREAK",
  BREAK_SETTINGS = "BREAK_SETTINGS",
}
