import { Calendar, ClipboardList, Coffee, Download, FileText, Info, LayoutDashboard, LogOut, Menu, Settings, Users } from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { RoleUtils } from "@/lib/role";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import VersionBadge from "@/components/VersionBadge";
import WhatsNewButton from "@/components/WhatsNewButton";

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const { data: session } = useSession();
    const isAdmin = RoleUtils.isAdmin(session?.user?.role);

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
            <aside className="w-64 bg-background border-r border-border/50 hidden md:block fixed left-0 top-0 bottom-0 z-10 flex-col">
                <div className="p-6 border-b">
                    <h2 className="text-2xl font-bold">{isAdmin ? "Admin Panel" : "Manager Panel"}</h2>
                </div>
                <nav className="flex-1 p-4 overflow-y-auto">
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
                        {isAdmin && (
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
                        )}
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
                        {isAdmin && (
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
                        )}
                        {isAdmin && (
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
                        )}
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
                        {isAdmin && (
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
                        )}
                    </ul>
                </nav>
                <div className="mt-auto p-4 space-y-3">
                    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                            <span>Version</span>
                            <VersionBadge />
                        </div>
                        <WhatsNewButton />
                    </div>
                </div>
                <div className="border-t mt-auto absolute bottom-0 left-0 right-0">
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
                    <h2 className="font-bold">{isAdmin ? "Admin Panel" : "Manager Panel"}</h2>
                    <div className="flex items-center gap-2">
                        <VersionBadge />
                        <Drawer open={open} onOpenChange={setOpen}>
                            <DrawerTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </DrawerTrigger>
                            <DrawerContent className="px-0 max-h-[85vh]">
                            <DrawerHeader className="border-b px-4">
                                <DrawerTitle>{isAdmin ? "Admin" : "Manager"} Navigation</DrawerTitle>
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
                                    {isAdmin && (
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
                                    )}
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
                                    {isAdmin && (
                                        <li>
                                            <button
                                                onClick={() => handleNavigation("logs")}
                                                className={`flex items-center w-full px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                                                    isActive("logs")
                                                        ? "bg-primary text-primary-foreground"
                                                        : "hover:bg-muted"
                                                }`}
                                            >
                                                <FileText className="mr-3 h-5 w-5" />
                                                Logs
                                            </button>
                                        </li>
                                    )}
                                    {isAdmin && (
                                        <li>
                                            <button
                                                onClick={() => handleNavigation("break-settings")}
                                                className={`flex items-center w-full px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                                                    isActive("break-settings")
                                                        ? "bg-primary text-primary-foreground"
                                                        : "hover:bg-muted"
                                                }`}
                                            >
                                                <Coffee className="mr-3 h-5 w-5" />
                                                Pausen
                                            </button>
                                        </li>
                                    )}
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
                                    {isAdmin && (
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
                                    )}
                                </ul>
                            </div>
                            <DrawerFooter className="border-t space-y-3">
                                <WhatsNewButton />
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
            </div>
        </>
    )
}