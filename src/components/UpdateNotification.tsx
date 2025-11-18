"use client";

import { useEffect, useState } from "react";
import { GitHubRelease, isUpdateAvailable, APP_VERSION } from "@/lib/version";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Download, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UpdateNotificationProps {
  userRole?: string;
}

export default function UpdateNotification({ userRole }: UpdateNotificationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [latestRelease, setLatestRelease] = useState<GitHubRelease | null>(null);

  useEffect(() => {
    // Only check for admins and managers
    if (!userRole || (userRole !== "ADMIN" && userRole !== "MANAGER")) {
      return;
    }

    // Check if already dismissed in this session
    const dismissedKey = `update-dismissed-${APP_VERSION}`;
    if (sessionStorage.getItem(dismissedKey)) {
      return;
    }

    const checkForUpdates = async () => {
      try {
        const response = await fetch("/api/version");
        const data = await response.json();

        if (data.latestRelease && isUpdateAvailable(APP_VERSION, data.latest)) {
          setLatestRelease(data.latestRelease);
          setIsOpen(true);
        }
      } catch (error) {
        console.error("Failed to check for updates:", error);
      }
    };

    checkForUpdates();
  }, [userRole]);

  if (!latestRelease) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-6xl w-[90vw] h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            <DialogTitle>Update Available</DialogTitle>
          </div>
          <DialogDescription className="flex items-center gap-2 pt-2">
            <span>Current version: v{APP_VERSION}</span>
            <span>→</span>
            <Badge variant="default">{latestRelease.tag_name}</Badge>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 min-h-0">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">{latestRelease.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Released on {new Date(latestRelease.published_at).toLocaleDateString()}
              </p>
            </div>

            {latestRelease.body && (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{latestRelease.body}</ReactMarkdown>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-4 flex-shrink-0">
          <Button
            variant="default"
            className="flex-1"
            onClick={() => window.open(latestRelease.html_url, "_blank")}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View on GitHub
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => window.open("/UPDATE_GUIDE.md", "_blank")}
          >
            <Download className="w-4 h-4 mr-2" />
            Update Guide
          </Button>
        </div>

        <div className="text-xs text-muted-foreground text-center pt-2">
          This notification will only appear once per session
        </div>
      </DialogContent>
    </Dialog>
  );
}
