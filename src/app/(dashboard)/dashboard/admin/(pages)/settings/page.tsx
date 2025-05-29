"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Settings as RefreshCw, Building, FileText, Globe, Clock, ShieldUser } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SettingDefinition } from "@/lib/settings";
import { PermissionManager } from "@/components/admin/PermissionManager";

interface Setting extends SettingDefinition {
  value: string | number | boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  // Fetch settings
  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/settings");
      const data = await response.json();
      setSettings(data.settings || []);
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      toast.error("Fehler beim Laden der Einstellungen");
    } finally {
      setIsLoading(false);
    }
  };

  // Save a setting
  const saveSetting = async (key: string, value: string | number | boolean) => {
    try {
      setIsSaving(true);
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key, value }),
      });

      if (!response.ok) {
        throw new Error("Failed to save setting");
      }

      toast.success("Einstellung gespeichert");
      
      // Update local state
      setSettings(settings.map(setting => 
        setting.key === key ? { ...setting, value } : setting
      ));
    } catch (error) {
      console.error("Failed to save setting:", error);
      toast.error("Fehler beim Speichern der Einstellung");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle setting changes
  const handleSettingChange = (key: string, value: string | number | boolean) => {
    saveSetting(key, value);
  };

  // Render the appropriate input for a setting
  const renderSettingInput = (setting: Setting) => {
    switch (setting.type) {
      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Switch
              id={setting.key}
              checked={setting.value as boolean}
              onCheckedChange={(checked) => handleSettingChange(setting.key, checked)}
            />
            <Label htmlFor={setting.key}>
              {setting.value ? "Aktiviert" : "Deaktiviert"}
            </Label>
          </div>
        );
      
      case "string":
        return (
          <Input
            id={setting.key}
            value={setting.value as string}
            onChange={(e) => handleSettingChange(setting.key, e.target.value)}
          />
        );
      
      case "text":
        return (
          <Textarea
            id={setting.key}
            value={setting.value as string}
            onChange={(e) => handleSettingChange(setting.key, e.target.value)}
            rows={5}
          />
        );
      
      case "number":
        return (
          <Input
            id={setting.key}
            type="number"
            value={setting.value as number}
            onChange={(e) => handleSettingChange(setting.key, parseFloat(e.target.value))}
          />
        );
      
      case "select":
        return (
          <Select
            value={setting.value as string}
            onValueChange={(value) => handleSettingChange(setting.key, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Auswählen..." />
            </SelectTrigger>
            <SelectContent>
              {setting.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case "color":
        return (
          <div className="flex gap-2">
            <Input
              id={setting.key}
              type="color"
              value={setting.value as string}
              onChange={(e) => handleSettingChange(setting.key, e.target.value)}
              className="w-16 h-10 p-1"
            />
            <Input
              value={setting.value as string}
              onChange={(e) => handleSettingChange(setting.key, e.target.value)}
              className="flex-1"
            />
          </div>
        );
      
      default:
        return (
          <Input
            id={setting.key}
            value={setting.value as string}
            onChange={(e) => handleSettingChange(setting.key, e.target.value)}
          />
        );
    }
  };

  // Load settings on component mount
  useEffect(() => {
    fetchSettings();
  }, []);

  if (isLoading && settings.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full" />
          <p className="text-muted-foreground">Lade Einstellungen...</p>
        </div>
      </div>
    );
  }

  const categoryIcons = {
    general: <Building className="h-4 w-4" />,
    legal: <FileText className="h-4 w-4" />,
    system: <Clock className="h-4 w-4" />,
    localization: <Globe className="h-4 w-4" />
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Einstellungen</h1>
          <p className="text-muted-foreground mt-2">
            Konfigurieren Sie die Anwendung nach Ihren Wünschen
          </p>
        </div>
        <Button onClick={fetchSettings} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Aktualisieren
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span className="hidden sm:inline">Allgemein</span>
          </TabsTrigger>
          <TabsTrigger value="legal" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Rechtliches</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">System</span>
          </TabsTrigger>
          <TabsTrigger value="localization" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Lokalisierung</span>
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <ShieldUser className="h-4 w-4" />
            <span className="hidden sm:inline">Berechtigungen</span>
          </TabsTrigger>
        </TabsList>

        {["general", "appearance", "legal", "system", "localization", "permissions"].map(category => (
          <TabsContent key={category} value={category} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {categoryIcons[category as keyof typeof categoryIcons]}
                  {category === "general" && "Allgemeine Einstellungen"}
                  {category === "appearance" && "Erscheinungsbild"}
                  {category === "legal" && "Rechtliche Informationen"}
                  {category === "system" && "Systemeinstellungen"}
                  {category === "localization" && "Lokalisierung"}
                  {category === "permissions" && "Berechtigungen"}
                </CardTitle>
                <CardDescription>
                  {category === "general" && "Grundlegende Konfiguration der Anwendung"}
                  {category === "appearance" && "Anpassen des visuellen Erscheinungsbilds"}
                  {category === "legal" && "Rechtliche Texte und Informationen"}
                  {category === "system" && "Systemverhalten und Funktionen"}
                  {category === "localization" && "Sprache und regionale Einstellungen"}
                  {category === "permissions" && "Verwalten von Rollen und Berechtigungen"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {settings
                  .filter(setting => setting.category === category)
                  .map((setting) => (
                    <div key={setting.key} className="grid gap-2">
                      <Label htmlFor={setting.key}>{setting.label}</Label>
                      {renderSettingInput(setting)}
                      {setting.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {setting.description}
                        </p>
                      )}
                    </div>
                  ))}
                  
                {settings.filter(setting => setting.category === category).length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    Keine Einstellungen in dieser Kategorie vorhanden
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}

        <TabsContent key="permissions" value="permissions" className="space-y-4">
          <PermissionManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}