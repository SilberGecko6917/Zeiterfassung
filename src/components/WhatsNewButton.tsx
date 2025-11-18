"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GitHubRelease, APP_VERSION, isUpdateAvailable } from "@/lib/version";
import { Bell, ExternalLink, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function WhatsNewButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [releases, setReleases] = useState<GitHubRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasUpdate, setHasUpdate] = useState(false);

  useEffect(() => {
    const fetchReleases = async () => {
      try {
        const response = await fetch(
          "https://api.github.com/repos/SilberGecko6917/Zeiterfassung/releases?per_page=5",
          {
            headers: {
              Accept: "application/vnd.github.v3+json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setReleases(data);
          
          // Check if there's an update available
          if (data.length > 0 && data[0].tag_name) {
            setHasUpdate(isUpdateAvailable(APP_VERSION, data[0].tag_name));
          }
        }
      } catch (error) {
        console.error("Failed to fetch releases:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchReleases();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Bell className="w-4 h-4 mr-2" />
          What&apos;s New
          {hasUpdate && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl w-[90vw] h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Release Notes & Updates</DialogTitle>
          <DialogDescription>
            Current version: v{APP_VERSION}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : releases.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No releases found
          </div>
        ) : (
          <ScrollArea className="flex-1 pr-4 min-h-0">
            <div className="space-y-6">
              {releases.map((release, index) => (
                <div key={release.tag_name} className="border-b pb-6 last:border-0">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{release.name || release.tag_name}</h3>
                      <Badge variant={index === 0 ? "default" : "secondary"}>
                        {release.tag_name}
                      </Badge>
                      {index === 0 && isUpdateAvailable(APP_VERSION, release.tag_name) && (
                        <Badge variant="destructive">New</Badge>
                      )}
                      {release.prerelease && (
                        <Badge variant="outline">Pre-release</Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(release.html_url, "_blank")}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">
                    Released on {new Date(release.published_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>

                  {release.body && (
                    <div className="prose prose-sm dark:prose-invert max-w-3xl">
                      <ReactMarkdown>{release.body}</ReactMarkdown>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <div className="flex gap-2 pt-4 border-t flex-shrink-0">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => window.open("https://github.com/SilberGecko6917/Zeiterfassung/releases", "_blank")}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View All Releases
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
