import { prisma } from "@/lib/prisma";

// Define the types of settings we support
export type SettingType = "string" | "number" | "boolean" | "text" | "select" | "color";
export type SettingCategory = "general" | "appearance" | "legal" | "system" | "localization" | "permissions";

export interface SettingDefinition {
  key: string;
  type: SettingType;
  label: string;
  description?: string;
  defaultValue: string | number | boolean;
  category: SettingCategory;
  options?: Array<{ value: string; label: string }>; // For select type
}

// Define permission types for better type safety
export interface Permission {
  id: string;
  name: string;
  description: string;
  category: "time" | "user" | "vacation" | "report" | "system";
}

// Define available permissions
export const availablePermissions: Permission[] = [
  // Time tracking permissions
  { id: "view_own_time", name: "Eigene Zeiten einsehen", description: "Kann eigene Zeiterfassung einsehen", category: "time" },
  { id: "edit_own_time", name: "Eigene Zeiten bearbeiten", description: "Kann eigene Zeiterfassungen bearbeiten", category: "time" },
  { id: "view_all_time", name: "Alle Zeiten einsehen", description: "Kann Zeiterfassung aller Nutzer einsehen", category: "time" },
  { id: "edit_all_time", name: "Alle Zeiten bearbeiten", description: "Kann Zeiterfassungen aller Nutzer bearbeiten", category: "time" },
  
  // User management
  { id: "view_users", name: "Benutzer einsehen", description: "Kann Benutzerprofile einsehen", category: "user" },
  { id: "create_users", name: "Benutzer erstellen", description: "Kann neue Benutzer anlegen", category: "user" },
  { id: "edit_users", name: "Benutzer bearbeiten", description: "Kann Benutzerprofile bearbeiten", category: "user" },
  { id: "delete_users", name: "Benutzer löschen", description: "Kann Benutzer löschen", category: "user" },
  
  // Vacation management
  { id: "request_vacation", name: "Urlaub beantragen", description: "Kann Urlaub beantragen", category: "vacation" },
  { id: "manage_all_vacation", name: "Alle Urlaube verwalten", description: "Kann alle Urlaube verwalten", category: "vacation" },
  
  // Reports
  { id: "view_own_reports", name: "Eigene Berichte", description: "Kann Berichte zu eigenen Zeiten einsehen", category: "report" },
  { id: "view_all_reports", name: "Alle Berichte", description: "Kann alle Berichte einsehen", category: "report" },
  { id: "export_reports", name: "Berichte exportieren", description: "Kann Berichte exportieren", category: "report" },
  
  // System settings
  { id: "manage_settings", name: "Einstellungen verwalten", description: "Kann Systemeinstellungen verwalten", category: "system" },
];

// Default role permissions
export const defaultRolePermissions = {
  ADMIN: availablePermissions.map(p => p.id), // All permissions
  MANAGER: [
    "view_own_time", "edit_own_time", 
    "view_users", 
    "request_vacation",
    "view_own_reports", "export_reports"
  ],
  USER: [
    "view_own_time", "edit_own_time",
    "request_vacation",
    "view_own_reports"
  ]
};

// Define all settings
export const settingsDefinitions: SettingDefinition[] = [
  // General Settings
  {
    key: "company_name",
    type: "string",
    label: "Firmenname",
    description: "Name der Firma, wird im Titel und Footer angezeigt.",
    defaultValue: "Meine Firma GmbH",
    category: "general",
  },
  {
    key: "contact_email",
    type: "string",
    label: "Kontakt E-Mail",
    description: "E-Mail-Adresse für Anfragen und Support.",
    defaultValue: "info@meinefirma.de",
    category: "general",
  },
  {
    key: "contact_phone",
    type: "string",
    label: "Kontakt Telefon",
    description: "Telefonnummer für Anfragen und Support.",
    defaultValue: "+49 123 456789",
    category: "general",
  },

  // Legal Settings
  {
    key: "impressum",
    type: "text",
    label: "Impressum",
    description: "Url zum Impressum der Firma.",
    defaultValue: "https://impressum.meinefirma.de",
    category: "legal",
  },
  {
    key: "datenschutz",
    type: "text",
    label: "Datenschutzerklärung",
    description: "Url zur Datenschutzerklärung der Firma.",
    defaultValue: "https://datenschutz.meinefirma.de",
    category: "legal",
  },

  // System Settings
  {
    key: "disable_landing_page",
    type: "boolean",
    label: "Landing Page deaktivieren",
    description: "Wenn aktiviert, werden Benutzer direkt zur Login-Seite weitergeleitet.",
    defaultValue: false,
    category: "system",
  },

  // Localization Settings
  {
    key: "time_format",
    type: "select",
    label: "Zeitformat",
    description: "Format für die Anzeige von Zeiten.",
    defaultValue: "24h",
    category: "localization",
    options: [
      { value: "24h", label: "24 Stunden (HH:MM)" },
      { value: "12h", label: "12 Stunden (hh:MM AM/PM)" },
    ],
  },
  {
    key: "date_format",
    type: "select",
    label: "Datumsformat",
    description: "Format für die Anzeige von Datumsangaben.",
    defaultValue: "dd.MM.yyyy",
    category: "localization",
    options: [
      { value: "dd.MM.yyyy", label: "TT.MM.JJJJ" },
      { value: "MM/dd/yyyy", label: "MM/TT/JJJJ" },
      { value: "yyyy-MM-dd", label: "JJJJ-MM-TT" },
    ],
  },
  {
    key: "default_language",
    type: "select",
    label: "Standardsprache",
    description: "Standardsprache für die Benutzeroberfläche.",
    defaultValue: "de",
    category: "localization",
    options: [
      { value: "de", label: "Deutsch" },
      { value: "en", label: "Englisch" },
    ],
  },
  
  // Role permission settings
  {
    key: "role_permissions",
    type: "text",
    label: "Rollenberechtigungen",
    description: "Berechtigungen für verschiedene Benutzerrollen",
    defaultValue: JSON.stringify(defaultRolePermissions),
    category: "permissions",
  }
];

// Function to get a setting by key
export async function getSetting<T>(key: string): Promise<T> {
  const definition = settingsDefinitions.find((def) => def.key === key);
  
  if (!definition) {
    throw new Error(`Setting with key '${key}' not found`);
  }
  
  // Try to get from database
  const setting = await prisma.setting.findUnique({
    where: { key },
  });
  
  // If not in database, return default value
  if (!setting) {
    return definition.defaultValue as unknown as T;
  }
  
  // Convert value based on type
  if (definition.type === "boolean") {
    return (setting.value === "true") as unknown as T;
  } else if (definition.type === "number") {
    return Number(setting.value) as unknown as T;
  }
  
  return setting.value as unknown as T;
}

// Function to set a setting
export async function saveSetting(key: string, value: string | number | boolean): Promise<void> {
  const definition = settingsDefinitions.find((def) => def.key === key);
  
  if (!definition) {
    throw new Error(`Setting with key '${key}' not found`);
  }
  
  // Convert value to string for storage
  const stringValue = value.toString();
  
  // Upsert the setting
  await prisma.setting.upsert({
    where: { key },
    update: { value: stringValue },
    create: {
      key,
      value: stringValue,
    },
  });
}

// Function to get all settings with their values
export async function getAllSettings(): Promise<Array<SettingDefinition & { value: string | number | boolean }>> {
  const dbSettings = await prisma.setting.findMany();
  
  return settingsDefinitions.map((definition) => {
    const dbSetting = dbSettings.find((s) => s.key === definition.key);
    let value: string | number | boolean = definition.defaultValue;
    
    if (dbSetting) {
      if (definition.type === "boolean") {
        value = dbSetting.value === "true";
      } else if (definition.type === "number") {
        value = Number(dbSetting.value);
      } else {
        value = dbSetting.value;
      }
    }
    
    return {
      ...definition,
      value,
    };
  });
}

// Helper function to get role permissions
export async function getRolePermissions(): Promise<Record<string, string[]>> {
  const permissionsJson = await getSetting<string>("role_permissions");
  try {
    return JSON.parse(permissionsJson);
  } catch (e) {
    console.error("Error parsing permissions:", e);
    return defaultRolePermissions;
  }
}

// Helper function to save role permissions
export async function saveRolePermissions(permissions: Record<string, string[]>): Promise<void> {
  await saveSetting("role_permissions", JSON.stringify(permissions));
}

// Helper to check if a user has a specific permission
export async function hasPermission(userRole: string, permissionId: string): Promise<boolean> {
  const permissions = await getRolePermissions();
  return permissions[userRole]?.includes(permissionId) || false;
}

// Debug version to help troubleshoot
export async function debugRolePermissions(): Promise<{
  dbValue: string;
  parsedValue: any;
  defaultValue: any;
  finalValue: Record<string, string[]>;
}> {
  try {
    // Get the raw value from the setting
    const dbValue = await getSetting<string>("role_permissions");
    
    // Try to parse it
    let parsedValue;
    try {
      parsedValue = JSON.parse(dbValue);
    } catch (e) {
      parsedValue = null;
    }
    
    // Get the default value
    const defaultValue = defaultRolePermissions;
    
    // The final value used
    const finalValue = parsedValue || defaultValue;
    
    return {
      dbValue,
      parsedValue,
      defaultValue,
      finalValue
    };
  } catch (e) {
    console.error("Error in debugRolePermissions:", e);
    return {
      dbValue: "ERROR",
      parsedValue: null,
      defaultValue: defaultRolePermissions,
      finalValue: defaultRolePermissions
    };
  }
}