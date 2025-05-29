import { Calendar, ClipboardList, Coffee, Download, Info, LayoutDashboard, LogOut, Menu, Settings, Users } from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [open, setOpen] = useState(false);

    const handleNavigation = (section: string) => {
        const path =
            section === "dashboard"
                ? "/dashboard/admin"
                : `/dashboard/admin/${section}`;
        router.push(path);
        setOpen(false);
    };

    const isActive = (section: string) => {
        if (section === "dashboard") {
            return pathname === "/dashboard/admin";
        }
        return pathname.includes(`/admin/${section}`);
    };

    return (
        <>
            {/* Sidebar */}
            <aside className="w-64 bg-background border-r border-border/50 hidden md:block fixed left-0 top-0 bottom-0 z-10">
                <div className="p-6 border-b">
                    <h2 className="text-2xl font-bold">Admin Panel</h2>
                </div>
                <nav className="flex-1 p-4">
                    <ul className="space-y-2">
                        <li>
                            <button
                                onClick={() => handleNavigation("dashboard")}
                                className={`flex items-center w-full px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                                    isActive("dashboard")
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
                                onClick={() => handleNavigation("users")}
                                className={`flex items-center w-full px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                                    isActive("users")
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
                                onClick={() => handleNavigation("activities")}
                                className={`flex items-center w-full px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                                    isActive("activities")
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
                                onClick={() => handleNavigation("logs")}
                                className={`flex items-center w-full px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                                    isActive("logs")
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
                                onClick={() => handleNavigation("breaks")}
                                className={`flex items-center w-full px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                                    isActive("breaks")
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
                                onClick={() => handleNavigation("export")}
                                className={`flex items-center w-full px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                                    isActive("export")
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
                                onClick={() => handleNavigation("vacations")}
                                className={`flex items-center w-full px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                                    isActive("vacations")
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
                                onClick={() => handleNavigation("settings")}
                                className={`flex items-center w-full px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                                    isActive("settings")
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

            {/* Mobile Nav with Drawer */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b border-border/50">
                <div className="flex items-center justify-between p-4">
                    <h2 className="font-bold">Admin Panel</h2>
                    <Drawer open={open} onOpenChange={setOpen}>
                        <DrawerTrigger asChild>
                            <Button variant="outline" size="icon">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </DrawerTrigger>
                        <DrawerContent className="px-0 max-h-[85vh]">
                            <DrawerHeader className="border-b px-4">
                                <DrawerTitle>Admin Navigation</DrawerTitle>
                            </DrawerHeader>
                            <div className="px-4 py-2 overflow-y-auto">
                                <ul className="space-y-2 py-2">
                                    <li>
                                        <button
                                            onClick={() => handleNavigation("dashboard")}
                                            className={`flex items-center w-full px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                                                isActive("dashboard")
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
                                            onClick={() => handleNavigation("users")}
                                            className={`flex items-center w-full px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                                                isActive("users")
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
                                            onClick={() => handleNavigation("activities")}
                                            className={`flex items-center w-full px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                                                isActive("activities")
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
                                            onClick={() => handleNavigation("logs")}
                                            className={`flex items-center w-full px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                                                isActive("logs")
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
                                            onClick={() => handleNavigation("breaks")}
                                            className={`flex items-center w-full px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                                                isActive("breaks")
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
                                            onClick={() => handleNavigation("export")}
                                            className={`flex items-center w-full px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                                                isActive("export")
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
                                            onClick={() => handleNavigation("vacations")}
                                            className={`flex items-center w-full px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                                                isActive("vacations")
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
                                            onClick={() => handleNavigation("settings")}
                                            className={`flex items-center w-full px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                                                isActive("settings")
                                                    ? "bg-primary text-primary-foreground"
                                                    : "hover:bg-muted"
                                            }`}
                                        >
                                            <Settings className="mr-3 h-5 w-5" />
                                            Einstellungen
                                        </button>
                                    </li>
                                </ul>
                            </div>
                            <DrawerFooter className="border-t">
                                <DrawerClose asChild>
                                    <Link href="/dashboard" className="w-full block">
                                        <Button
                                        variant="outline"
                                        className="w-full flex items-center justify-center"
                                        >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Zurück zum Dashboard
                                        </Button>
                                    </Link>
                                </DrawerClose>
                            </DrawerFooter>
                        </DrawerContent>
                    </Drawer>
                </div>
            </div>
        </>
    )
}