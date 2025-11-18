import { VERSION } from "./constants";

export interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  html_url: string;
  published_at: string;
  draft: boolean;
  prerelease: boolean;
}
export const APP_VERSION = VERSION;

export async function getLatestGitHubRelease(): Promise<GitHubRelease | null> {
  try {
    const response = await fetch(
      "https://api.github.com/repos/SilberGecko6917/Zeiterfassung/releases/latest",
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    );

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch GitHub release:", error);
    return null;
  }
}

export function compareVersions(current: string, latest: string): number {
  // Remove 'v' prefix if present
  const cleanCurrent = current.replace(/^v/, "");
  const cleanLatest = latest.replace(/^v/, "");

  const currentParts = cleanCurrent.split(".").map(Number);
  const latestParts = cleanLatest.split(".").map(Number);

  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const currentPart = currentParts[i] || 0;
    const latestPart = latestParts[i] || 0;

    if (currentPart < latestPart) return -1;
    if (currentPart > latestPart) return 1;
  }

  return 0;
}

export function isUpdateAvailable(current: string, latest: string): boolean {
  return compareVersions(current, latest) < 0;
}
