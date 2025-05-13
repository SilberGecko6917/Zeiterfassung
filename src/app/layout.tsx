import type { Metadata } from "next";
import "./globals.css";
import { PROJECT_NAME, PROJECT_DESCRIPTION } from "@/lib/constants";
import { Providers } from "@/app/providers";
import { initializeServerCron } from "@/lib/cron-initializer";

if (typeof window === "undefined") {
  initializeServerCron();
}

export const metadata: Metadata = {
  title: PROJECT_NAME,
  description: PROJECT_DESCRIPTION,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
