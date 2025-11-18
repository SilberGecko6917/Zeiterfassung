export interface Permission {
  id: string;
  name: string;
  description: string;
  category: "time" | "user" | "vacation" | "report" | "system";
}

export const availablePermissions: Permission[] = [
  { id: "view_own_time", name: "Eigene Zeiten einsehen", description: "Kann eigene Zeiterfassung einsehen", category: "time" },
  { id: "edit_own_time", name: "Eigene Zeiten bearbeiten", description: "Kann eigene Zeiterfassungen bearbeiten", category: "time" },
  { id: "view_all_time", name: "Alle Zeiten einsehen", description: "Kann Zeiterfassung aller Nutzer einsehen", category: "time" },
  { id: "edit_all_time", name: "Alle Zeiten bearbeiten", description: "Kann Zeiterfassungen aller Nutzer bearbeiten", category: "time" },

  { id: "view_users", name: "Benutzer einsehen", description: "Kann Benutzerprofile einsehen", category: "user" },
  { id: "create_users", name: "Benutzer erstellen", description: "Kann neue Benutzer anlegen", category: "user" },
  { id: "edit_users", name: "Benutzer bearbeiten", description: "Kann Benutzerprofile bearbeiten", category: "user" },
  { id: "delete_users", name: "Benutzer löschen", description: "Kann Benutzer löschen", category: "user" },

  { id: "request_vacation", name: "Urlaub beantragen", description: "Kann Urlaub beantragen", category: "vacation" },
  { id: "manage_all_vacation", name: "Alle Urlaube verwalten", description: "Kann alle Urlaube verwalten", category: "vacation" },

  { id: "view_own_reports", name: "Eigene Berichte", description: "Kann Berichte zu eigenen Zeiten einsehen", category: "report" },
  { id: "view_all_reports", name: "Alle Berichte", description: "Kann alle Berichte einsehen", category: "report" },
  { id: "export_reports", name: "Berichte exportieren", description: "Kann Berichte exportieren", category: "report" },

  { id: "manage_settings", name: "Einstellungen verwalten", description: "Kann Systemeinstellungen verwalten", category: "system" },
];

export const defaultRolePermissions: Record<string, string[]> = {
  ADMIN: availablePermissions.map((p) => p.id),
  MANAGER: [
    "view_own_time",
    "edit_own_time",
    "view_all_time",
    "view_users",
    "request_vacation",
    "manage_all_vacation",
    "view_own_reports",
    "view_all_reports",
    "export_reports",
  ],
  USER: ["view_own_time", "edit_own_time", "request_vacation", "view_own_reports"],
};

export type RolePermissions = typeof defaultRolePermissions;
