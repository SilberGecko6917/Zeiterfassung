"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PROJECT_NAME } from "@/lib/constants";
import {
  Clock,
  PieChart,
  Calendar,
  Download,
  Users,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";

export default function Home() {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Navigation */}
      <nav className="container mx-auto p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Clock className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">{PROJECT_NAME}</span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {session ? (
            <Link href="/dashboard">
              <Button>Dashboard</Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button>Einloggen</Button>
            </Link>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto py-20 px-4 flex flex-col lg:flex-row items-center">
        <div className="lg:w-1/2 space-y-6">
          <motion.h1
            className="text-4xl md:text-5xl xl:text-6xl font-bold leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Einfache und effektive{" "}
            <span className="text-primary">Zeiterfassung</span> für Ihr
            Unternehmen
          </motion.h1>
          <motion.p
            className="text-lg text-muted-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Erfassen, verwalten und analysieren Sie Arbeitszeiten müheloser denn
            je – mit einer intuitiven Plattform, die für Teams jeder Größe
            entwickelt wurde.
          </motion.p>
          <motion.div
            className="flex flex-wrap gap-4 pt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            {session ? (
              <Link href="/dashboard">
                <Button size="lg" className="gap-2">
                  <Clock className="h-5 w-5" />
                  Zum Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button size="lg" className="gap-2">
                  <Clock className="h-5 w-5" />
                  Einloggen
                </Button>
              </Link>
            )}
          </motion.div>
        </div>
        <motion.div
          className="lg:w-1/2 mt-12 lg:mt-0 flex justify-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, type: "spring" }}
        >
          <div className="relative w-[350px] h-[350px] md:w-[450px] md:h-[450px] bg-gradient-to-tr from-primary/20 to-primary/40 rounded-full flex items-center justify-center">
            <Clock className="w-32 h-32 text-primary" strokeWidth={1.25} />
            <div className="absolute top-12 right-12 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
              <p className="text-3xl font-mono font-bold">08:42:15</p>
            </div>
            <div className="absolute bottom-16 left-10 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl font-bold">Unsere Funktionen</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Alles, was Sie für eine effektive Zeiterfassung und -verwaltung
              benötigen
            </p>
          </div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={itemVariants}>
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardContent className="pt-6 space-y-4">
                  <div className="bg-primary/10 p-3 rounded-lg w-fit">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-xl">Echtzeit-Zeiterfassung</h3>
                  <p className="text-muted-foreground">
                    Erfassen Sie Ihre Arbeitszeit mit einem einfachen Klick.
                    Start und Stopp für präzise Zeiterfassung in Echtzeit.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardContent className="pt-6 space-y-4">
                  <div className="bg-primary/10 p-3 rounded-lg w-fit">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-xl">Manuelle Einträge</h3>
                  <p className="text-muted-foreground">
                    Erfassen Sie vergangene Arbeitszeiten nachträglich mit
                    benutzerfreundlichen Kalenderfunktionen.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardContent className="pt-6 space-y-4">
                  <div className="bg-primary/10 p-3 rounded-lg w-fit">
                    <PieChart className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-xl">
                    Statistiken & Übersichten
                  </h3>
                  <p className="text-muted-foreground">
                    Behalten Sie den Überblick über Ihre Arbeitszeiten mit
                    detaillierten Statistiken und Zusammenfassungen.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardContent className="pt-6 space-y-4">
                  <div className="bg-primary/10 p-3 rounded-lg w-fit">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-xl">Benutzerverwaltung</h3>
                  <p className="text-muted-foreground">
                    Verwalten Sie Benutzer mit verschiedenen Rollen und
                    Berechtigungen für Ihr Team.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardContent className="pt-6 space-y-4">
                  <div className="bg-primary/10 p-3 rounded-lg w-fit">
                    <Download className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-xl">Export-Funktionen</h3>
                  <p className="text-muted-foreground">
                    Exportieren Sie Arbeitszeitdaten als Excel-Dateien für
                    Abrechnungen oder weitere Analysen.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardContent className="pt-6 space-y-4">
                  <div className="bg-primary/10 p-3 rounded-lg w-fit">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-xl">Admin-Dashboard</h3>
                  <p className="text-muted-foreground">
                    Umfassende Verwaltungstools für Administratoren, um die
                    gesamte Zeiterfassung zu überwachen.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto py-20 px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold">
            Bereit für effiziente Zeiterfassung?
          </h2>
          <p className="text-muted-foreground">
            Melden Sie sich an und beginnen Sie noch heute mit der Erfassung
            Ihrer Arbeitszeit
          </p>
          <div className="pt-4">
            {session ? (
              <Link href="/dashboard">
                <Button size="lg">Dashboard öffnen</Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button size="lg">Jetzt starten</Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold">{PROJECT_NAME}</span>
          </div>
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} {PROJECT_NAME}. Alle Rechte
            vorbehalten.
          </p>
        </div>
      </footer>
    </div>
  );
}
