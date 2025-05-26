import { Calendar, ClipboardList, Coffee, Download, Info, LayoutDashboard, LogOut, Settings, Users } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import Link from "next/link";

export function Sidebar() {
    const [activeSection, setActiveSection] = useState("dashboard");

    return (
        <>
            <aside className="w-64 bg-background border-r border-border/50 hidden md:block fixed left-0 top-0 bottom-0 z-10">
                <div className="p-6 border-b">
                <h2 className="text-2xl font-bold">Admin Panel</h2>
                </div>
                <nav className="flex-1 p-4">
                <ul className="space-y-2">
                    <li>
                        <button
                            onClick={() => setActiveSection("dashboard")}
                            className={`flex items-center w-full px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                            activeSection === "dashboard"
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted"
                            }`}
                        >
                            <LayoutDashboard className="mr-3 h-5 w-5" />
                            Dashboard
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={() => setActiveSection("users")}
                            className={`flex items-center w-full px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                            activeSection === "users"
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted"
                            }`}
                        >
                            <Users className="mr-3 h-5 w-5" />
                            Benutzer
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={() => setActiveSection("activities")}
                            className={`flex items-center w-full px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                            activeSection === "activities"
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted"
                            }`}
                        >
                            <ClipboardList className="mr-3 h-5 w-5" />
                            Aktivitäten
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={() => setActiveSection("logs")}
                            className={`flex items-center w-full px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                            activeSection === "logs"
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted"
                            }`}
                        >
                            <Info className="mr-3 h-5 w-5" />
                            Logs
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={() => setActiveSection("breaks")}
                            className={`flex items-center w-full px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                            activeSection === "breaks"
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted"
                            }`}
                        >
                            <Coffee className="mr-3 h-5 w-5" />
                            Pausen
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={() => setActiveSection("export")}
                            className={`flex items-center w-full px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                            activeSection === "export"
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted"
                            }`}
                        >
                            <Download className="mr-3 h-5 w-5" />
                            Export
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={() => setActiveSection("vacations")}
                            className={`flex items-center w-full px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                            activeSection === "vacations"
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted"
                            }`}
                        >
                            <Calendar className="mr-3 h-5 w-5" />
                            Urlaubsanträge
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={() => setActiveSection("settings")}
                            className={`flex items-center w-full px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                            activeSection === "settings"
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted"
                            }`}
                        >
                            <Settings className="mr-3 h-5 w-5" />
                            Einstellungen
                        </button>
                    </li>
                </ul>
                </nav>
                <div className="border-t mt-auto absolute bottom-0 left-0 right-0 w-full">
                    <Link href="/dashboard" className="w-full block">
                        <Button
                        variant="outline"
                        className="w-full rounded-none border-0 h-15 flex items-center justify-center"
                        >
                        <LogOut className="mr-2 h-4 w-4" />
                        Zurück
                        </Button>
                    </Link>
                </div>
            </aside>

            {/* Mobile Nav */}
            <div className="md:hidden w-full fixed top-0 left-0 z-10 bg-background border-b border-border/50">
                <div className="flex items-center justify-between p-4">
                <h2 className="font-bold">Admin Panel</h2>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant={activeSection === "dashboard" ? "default" : "ghost"}
                        onClick={() => setActiveSection("dashboard")}
                    >
                        <LayoutDashboard className="h-4 w-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant={activeSection === "users" ? "default" : "ghost"}
                        onClick={() => setActiveSection("users")}
                    >
                        <Users className="h-4 w-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant={activeSection === "activities" ? "default" : "ghost"}
                        onClick={() => setActiveSection("activities")}
                    >
                        <ClipboardList className="h-4 w-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant={activeSection === "logs" ? "default" : "ghost"}
                        onClick={() => setActiveSection("logs")}
                    >
                        <Info className="h-4 w-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant={activeSection === "breaks" ? "default" : "ghost"}
                        onClick={() => setActiveSection("breaks")}
                    >
                        <Coffee className="h-4 w-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant={activeSection === "export" ? "default" : "ghost"}
                        onClick={() => setActiveSection("export")}
                    >
                        <Download className="h-4 w-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant={activeSection === "vacations" ? "default" : "ghost"}
                        onClick={() => setActiveSection("vacations")}
                    >
                        <Calendar className="h-4 w-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant={activeSection === "settings" ? "default" : "ghost"}
                        onClick={() => setActiveSection("settings")}
                    >
                        <Settings className="h-4 w-4" />
                    </Button>
                    <Link href="/dashboard">
                        <Button size="sm" variant="outline">
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
      </>
    )
}