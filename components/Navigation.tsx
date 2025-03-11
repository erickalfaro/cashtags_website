// components/Navigation.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks";

export const Navigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Hamburger on the Left */}
      <button
        className="fixed top-4 left-6 z-50 focus:outline-none"
        onClick={toggleMenu}
        aria-label="Toggle navigation menu"
      >
        <svg
          className="w-6 h-6 text-gray-200"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
          />
        </svg>
      </button>

      {/* Cashtags on the Right */}
      <Link
        href="/"
        className="fixed top-6 right-6 z-50 text-xl font-bold text-[rgba(0,230,118,1)] hover:text-[rgba(0,255,130,1)]"
      >
        Cashtags
      </Link>

      {/* Sidebar */}
      <nav
        className={`fixed top-0 left-0 h-full w-64 bg-gray-900 text-gray-200 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out z-40`}
      >
        <div className="flex flex-col p-4 space-y-6 mt-16">
          <Link href="/" onClick={toggleMenu} className="text-lg hover:text-blue-400">Home</Link>
          {user && (
            <>
              <Link href="/my-account" onClick={toggleMenu} className="text-lg hover:text-blue-400">My Account</Link>
              <Link href="/billing" onClick={toggleMenu} className="text-lg hover:text-blue-400">Billing</Link>
            </>
          )}
          <Link href="/legal" onClick={toggleMenu} className="text-lg hover:text-blue-400">Legal</Link>
          {/* Logout button removed */}
        </div>
      </nav>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={toggleMenu}
        ></div>
      )}
    </>
  );
};