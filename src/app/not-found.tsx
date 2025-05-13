"use client";

import { CircleX } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <section className="min-h-screen flex items-center justify-center p-4">
      <div className="container flex flex-col items-center justify-center px-5 mx-auto my-8">
        <div className="max-w-md text-center">
          <CircleX className="mx-auto w-16 h-16 mb-5 text-red-500" />
          <p className="text-2xl font-semibold md:text-3xl">
            Sorry, diese Seite existiert nicht.
          </p>
          <p className="mt-4 mb-8 text-gray-300">
            Aber keine Sorge, du kannst immer noch zurück zur Startseite.
          </p>
          <Link
            rel="noopener noreferrer"
            href="/"
            className="px-8 py-3 font-semibold rounded dark:bg-violet-600 dark:text-gray-50"
          >
            Zurück zur Startseite
          </Link>
        </div>
      </div>
    </section>
  );
}
