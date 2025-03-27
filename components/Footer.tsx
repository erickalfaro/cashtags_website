"use client";

import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-400 py-6 mt-12">
      <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center px-4">
        <p className="text-sm">&copy; {year} Cashtags LLC. All rights reserved.</p>
        <nav className="flex gap-6 text-sm mt-2 sm:mt-0">
          <Link href="/terms.html">Terms</Link>
          <Link href="/privacy.html">Privacy</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </div>
    </footer>
  );
}
