import type { Metadata } from "next";
import "./globals.css";
import { PROJECT_NAME, PROJECT_DESCRIPTION } from "@/lib/constants";
import { Providers } from "@/app/providers";
import { initCronJobsMiddleware } from "@/middleware/init-cron";

export const metadata: Metadata = {
  title: PROJECT_NAME,
  description: PROJECT_DESCRIPTION,
};

initCronJobsMiddleware();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
