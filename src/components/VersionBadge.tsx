"use client";

import { APP_VERSION } from "@/lib/version";
import { Badge } from "./ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Info } from "lucide-react";

interface VersionBadgeProps {
  className?: string;
}

export default function VersionBadge({ className }: VersionBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={className}>
            <Info className="w-5 h-5 mr-1" />
            v{APP_VERSION}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Current App Version</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
