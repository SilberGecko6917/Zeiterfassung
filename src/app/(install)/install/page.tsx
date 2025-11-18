"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock9, CheckCircle, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { PROJECT_NAME, VERSION } from "@/lib/constants";

const installSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: "Name muss mindestens 2 Zeichen lang sein" }),
    email: z
      .string()
      .email({ message: "Bitte geben Sie eine gültige E-Mail-Adresse ein" }),
    password: z
      .string()
      .min(8, { message: "Passwort muss mindestens 8 Zeichen lang sein" }),
    confirmPassword: z
      .string()
      .min(8, { message: "Passwort muss mindestens 8 Zeichen lang sein" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwörter stimmen nicht überein",
    path: ["confirmPassword"],
  });

type InstallFormValues = z.infer<typeof installSchema>;

export default function InstallPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [installSteps, setInstallSteps] = useState({
    checkingDatabase: true,
    databaseReady: false,
    creatingAdmin: false,
    adminCreated: false,
  });
  const router = useRouter();

  const form = useForm<InstallFormValues>({
    resolver: zodResolver(installSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const checkDatabase = async () => {
      try {
        const response = await fetch("/api/install/check-database");

        if (response.status === 403) {
          toast.error(
            "Die Installation wurde bereits abgeschlossen. Bitte melden Sie sich an."
          );
          setTimeout(() => {
            router.push("/login");
          }, 1000);
          return;
        }

        const data = await response.json();

        setInstallSteps((prev) => ({
          ...prev,
          checkingDatabase: false,
          databaseReady: data.success,
        }));

        if (!data.success) {
          toast.error("Datenbankverbindung konnte nicht hergestellt werden");
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error(error);
        setInstallSteps((prev) => ({
          ...prev,
          checkingDatabase: false,
          databaseReady: false,
        }));
        toast.error("Fehler bei der Überprüfung der Datenbankverbindung");
      }
    };

    checkDatabase();
  }, [router]);

  const onSubmit = async (data: InstallFormValues) => {
    setIsLoading(true);
    setInstallSteps((prev) => ({
      ...prev,
      creatingAdmin: true,
    }));

    try {
      const response = await fetch("/api/install/create-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Fehler beim Erstellen des Admin-Kontos"
        );
      }

      setInstallSteps((prev) => ({
        ...prev,
        creatingAdmin: false,
        adminCreated: true,
      }));

      toast.success("Admin-Konto erfolgreich erstellt!");

      setTimeout(() => {
        router.push("/login");
      }, 2000);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Fehler beim Erstellen des Admin-Kontos");
      setInstallSteps((prev) => ({
        ...prev,
        creatingAdmin: false,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto overflow-hidden border shadow-xl">
      <div className="flex justify-center pt-6">
        <Clock9 className="h-12 w-12 text-primary" />
      </div>

      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">
          {PROJECT_NAME} - Installation
        </CardTitle>
        <CardDescription>
          Erstellen Sie ein Administrator-Konto für die Zeiterfassung.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Installation Status */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            {installSteps.checkingDatabase ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : installSteps.databaseReady ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <div className="h-5 w-5 rounded-full bg-red-500" />
            )}
            <span className="text-sm font-medium">
              {installSteps.checkingDatabase
                ? "Überprüfe Datenbankverbindung..."
                : installSteps.databaseReady
                ? "Datenbankverbindung hergestellt"
                : "Datenbankverbindung fehlgeschlagen"}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {installSteps.creatingAdmin ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : installSteps.adminCreated ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <div className="h-5 w-5 rounded-full bg-gray-300" />
            )}
            <span className="text-sm font-medium">
              {installSteps.creatingAdmin
                ? "Erstelle Administrator-Konto..."
                : installSteps.adminCreated
                ? "Administrator-Konto erstellt"
                : "Administrator-Konto erstellen"}
            </span>
          </div>
        </div>

        {/* Form */}
        {installSteps.databaseReady && !installSteps.adminCreated && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Max Mustermann" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-Mail</FormLabel>
                    <FormControl>
                      <Input placeholder="admin@example.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Mit dieser E-Mail-Adresse können Sie sich später anmelden.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passwort</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passwort bestätigen</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !installSteps.databaseReady}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Installation läuft...</span>
                  </div>
                ) : (
                  <span>Administrator-Konto erstellen</span>
                )}
              </Button>
            </form>
          </Form>
        )}

        {/* Success Message */}
        {installSteps.adminCreated && (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <p className="text-xl font-medium">Installation erfolgreich!</p>
            <p>
              Ihr Administrator-Konto wurde erfolgreich erstellt. Sie werden in
              Kürze zur Anmeldeseite weitergeleitet.
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="text-center text-xs text-muted-foreground pt-0">
        <p className="w-full">
          {PROJECT_NAME} - Version {VERSION}
        </p>
      </CardFooter>
    </Card>
  );
}
