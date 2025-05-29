"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ShieldCheck, Save, AlertCircle, Lock } from "lucide-react";
import { 
  availablePermissions, 
  defaultRolePermissions,
  Permission
} from "@/lib/settings";
import { useSession } from "next-auth/react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Define role hierarchy (higher index = higher authority)
const roleHierarchy = {
  "USER": 0,
  "MANAGER": 1,
  "ADMIN": 2
};

// Critical permissions that ADMIN should always have
const criticalAdminPermissions = [
  "manage_settings",
  "edit_users",
  "create_users",
  "delete_users",
  "view_all_time",
  "edit_all_time",
  "manage_all_vacation"
];

const roles = [
  { id: "ADMIN", name: "Administrator", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  { id: "MANAGER", name: "Manager", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
  { id: "USER", name: "Benutzer", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" }
];

const categories = [
  { id: "time", name: "Zeiterfassung" },
  { id: "user", name: "Benutzerverwaltung" },
  { id: "vacation", name: "Urlaubsverwaltung" },
  { id: "report", name: "Berichte" },
  { id: "system", name: "System" }
];

export function PermissionManager() {
  const { data: session } = useSession();
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>(defaultRolePermissions);
  const [activeRole, setActiveRole] = useState("MANAGER");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Get current user's role with fallback to ADMIN for safety
  const userRole = session?.user?.role || "ADMIN"; // Fallback to ADMIN to ensure visibility
  const userRoleLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || roleHierarchy.ADMIN;

  // Log session info to help debug
  useEffect(() => {
    console.log("Session:", session);
    console.log("User role:", userRole);
    console.log("User role level:", userRoleLevel);
  }, [session, userRole, userRoleLevel]);

  // Determine which roles the current user can edit
  const editableRoles = roles.filter(role => 
    roleHierarchy[role.id as keyof typeof roleHierarchy] < userRoleLevel
  );

  // Fetch current permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/admin/permissions");
        const data = await response.json();
        
        if (data.permissions) {
          setRolePermissions(data.permissions);
        }
      } catch (error) {
        console.error("Error fetching permissions:", error);
        toast.error("Fehler beim Laden der Berechtigungen");
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  // Save permissions
  const savePermissions = async () => {
    try {
      // Ensure ADMIN always has critical permissions
      const finalPermissions = { ...rolePermissions };
      
      if (finalPermissions["ADMIN"]) {
        criticalAdminPermissions.forEach(permission => {
          if (!finalPermissions["ADMIN"].includes(permission)) {
            finalPermissions["ADMIN"].push(permission);
          }
        });
      }
      
      setSaving(true);
      const response = await fetch("/api/admin/permissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ permissions: finalPermissions }),
      });

      if (!response.ok) {
        throw new Error("Failed to save permissions");
      }

      // Update local state with enforced permissions
      setRolePermissions(finalPermissions);
      toast.success("Berechtigungen gespeichert");
    } catch (error) {
      console.error("Error saving permissions:", error);
      toast.error("Fehler beim Speichern der Berechtigungen");
    } finally {
      setSaving(false);
    }
  };

  // Toggle permission for a role
  const togglePermission = (permissionId: string) => {
    // Check if trying to remove a critical permission from ADMIN
    if (activeRole === "ADMIN" && criticalAdminPermissions.includes(permissionId) && 
        rolePermissions[activeRole].includes(permissionId)) {
      toast.error("Diese Berechtigung kann vom Administrator nicht entfernt werden", {
        description: "Sie ist für die Systemfunktionalität erforderlich."
      });
      return;
    }
    
    setRolePermissions(prev => {
      const updatedPermissions = { ...prev };
      
      if (updatedPermissions[activeRole].includes(permissionId)) {
        updatedPermissions[activeRole] = updatedPermissions[activeRole].filter(id => id !== permissionId);
      } else {
        updatedPermissions[activeRole] = [...updatedPermissions[activeRole], permissionId];
      }
      
      return updatedPermissions;
    });
  };

  // Reset to defaults
  const resetToDefaults = () => {
    setRolePermissions(prev => ({
      ...prev,
      [activeRole]: [...defaultRolePermissions[activeRole as keyof typeof defaultRolePermissions]]
    }));
    toast.info("Berechtigungen auf Standard zurückgesetzt");
  };

  // Enable all permissions
  const enableAllPermissions = (category?: string) => {
    setRolePermissions(prev => {
      const permissionsToAdd = category 
        ? availablePermissions.filter(p => p.category === category).map(p => p.id)
        : availablePermissions.map(p => p.id);
      
      const updatedPermissions = { ...prev };
      const currentPermissions = new Set(updatedPermissions[activeRole]);
      
      permissionsToAdd.forEach(id => currentPermissions.add(id));
      updatedPermissions[activeRole] = Array.from(currentPermissions);
      
      return updatedPermissions;
    });
  };

  // Render permissions by category
  const renderPermissionsByCategory = (category: string) => {
    const categoryPermissions = availablePermissions.filter(p => p.category === category);
    
    if (categoryPermissions.length === 0) {
      return <p className="text-sm text-muted-foreground">Keine Berechtigungen in dieser Kategorie</p>;
    }
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium">{categories.find(c => c.id === category)?.name}</h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => enableAllPermissions(category)}
          >
            Alle aktivieren
          </Button>
        </div>
        <div className="grid gap-3">
          {categoryPermissions.map((permission) => {
            // Determine if this is a critical permission that can't be toggled
            const isCritical = activeRole === "ADMIN" && 
                              criticalAdminPermissions.includes(permission.id) && 
                              rolePermissions[activeRole]?.includes(permission.id);
            
            return (
              <div key={permission.id} className="flex items-start space-x-2 bg-muted/30 p-2 rounded-md">
                <Checkbox
                  id={`${activeRole}-${permission.id}`}
                  checked={rolePermissions[activeRole]?.includes(permission.id)}
                  onCheckedChange={() => togglePermission(permission.id)}
                  disabled={isCritical}
                />
                <div className="grid gap-1 flex-1">
                  <div className="flex items-center justify-between">
                    <Label 
                      htmlFor={`${activeRole}-${permission.id}`}
                      className="font-medium"
                    >
                      {permission.name}
                    </Label>
                    {isCritical && (
                      <Badge variant="outline" className="flex items-center gap-1 text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
                        <Lock className="h-3 w-3" />
                        <span className="text-xs">Erforderlich</span>
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{permission.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Check if current user can edit the active role
  const canEditActiveRole = userRoleLevel >= roleHierarchy.ADMIN || 
                          roleHierarchy[activeRole as keyof typeof roleHierarchy] < userRoleLevel;

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xl">
          <ShieldCheck className="h-5 w-5" />
          Berechtigungsverwaltung
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Debug info - remove after fixing */}
        <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">
          <p>User Role: {userRole} (Level: {userRoleLevel})</p>
          <p>Roles: {JSON.stringify(roles.map(r => r.id))}</p>
          <p>Active Role: {activeRole}</p>
        </div>
        
        <Tabs 
          value={activeRole} 
          onValueChange={(value) => {
            // Only allow switching to roles the user can edit
            if (roleHierarchy[value as keyof typeof roleHierarchy] < userRoleLevel || 
                userRoleLevel >= roleHierarchy.ADMIN) {
              setActiveRole(value);
            } else {
              toast.error("Sie haben keine Berechtigung, diese Rolle zu bearbeiten");
            }
          }} 
          className="space-y-6"
        >
          <TabsList className="grid grid-cols-3 w-full">
            {roles.map(role => (
              <TabsTrigger 
                key={role.id} 
                value={role.id} 
                className="flex gap-2"
                disabled={userRoleLevel !== roleHierarchy.ADMIN && roleHierarchy[role.id as keyof typeof roleHierarchy] >= userRoleLevel}
              >
                <span>{role.name}</span>
                <Badge className={role.color}>{rolePermissions[role.id]?.length || 0}</Badge>
              </TabsTrigger>
            ))}
          </TabsList>
          
          {roles.map(role => (
            <TabsContent key={role.id} value={role.id} className="space-y-6">
              <div className="flex justify-between items-center">
                {/* Only show action buttons if user can edit this role */}
                {(roleHierarchy[role.id as keyof typeof roleHierarchy] < userRoleLevel || 
                  userRoleLevel >= roleHierarchy.ADMIN) && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={resetToDefaults}
                      disabled={saving}
                    >
                      Zurücksetzen
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={() => enableAllPermissions()}
                      disabled={saving}
                    >
                      Alle aktivieren
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Role hierarchy warning */}
              {!canEditActiveRole && (
                <Alert variant="destructive" className="bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Sie können Berechtigungen für diese Rolle nicht bearbeiten, da sie in der Hierarchie über Ihrer eigenen liegt.
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Admin critical permissions notice */}
              {role.id === "ADMIN" && (
                <Alert variant="default" className="bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Bestimmte Systemberechtigungen können vom Administrator nicht entfernt werden, um die Funktionalität des Systems zu gewährleisten.
                  </AlertDescription>
                </Alert>
              )}
              
              <Alert variant="default" className="bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Die Berechtigungen bestimmen, welche Bereiche der Anwendung für den Benutzer sichtbar und zugänglich sind. 
                  Benutzer sehen nur die Menüpunkte und Funktionen, für die sie entsprechende Berechtigungen haben.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-6">
                {categories.map(category => (
                  <div key={category.id} className="space-y-2">
                    {renderPermissionsByCategory(category.id)}
                  </div>
                ))}
              </div>
              
              <div className="space-y-6">
                {/* Only show save button if user can edit this role */}
                {canEditActiveRole && (
                  <div className="flex justify-end mt-6">
                    <Button 
                      onClick={savePermissions} 
                      disabled={saving}
                      className="flex items-center gap-2"
                    >
                      {saving ? (
                        <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Berechtigungen speichern
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}