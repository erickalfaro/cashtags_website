// components/Navigation.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks";

export const Navigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#0D1117] border-b border-[rgba(48,54,61,0.5)] px-6 py-4 shadow-[0_4px_12px_rgba(0,230,118,0.05)]">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Hamburger Button */}
          <button
            className="group focus:outline-none p-2 rounded-lg hover:bg-[rgba(0,230,118,0.1)] transition-colors duration-300"
            onClick={toggleMenu}
            aria-label="Toggle navigation menu"
          >
            <svg
              className="w-6 h-6 text-[rgba(0,230,118,1)] group-hover:text-[rgba(0,255,130,1)] transition-transform duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
              />
            </svg>
          </button>

          {/* Logo */}
          <Link
            href="/"
            className="text-2xl font-extrabold text-[rgba(0,230,118,1)] hover:text-[rgba(0,255,130,1)] transition-all duration-300 flex items-center gap-2 group"
          >
            <span className="relative">
              Cashtags
              <span className="absolute -bottom-1 left-0 w-full h-1 bg-[rgba(0,230,118,0.5)] rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
            </span>
            <span className="text-sm text-gray-400 group-hover:text-[rgba(0,230,118,1)] transition-colors duration-300">
              AI
            </span>
          </Link>
        </div>
      </div>

      {/* Sidebar */}
      <nav
        className={`fixed top-0 left-0 h-full w-72 bg-[#161B22] border-r border-[rgba(48,54,61,0.5)] transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-500 ease-in-out z-40 shadow-[4px_0_12px_rgba(0,230,118,0.05)]`}
      >
        <div className="p-6 mt-20 space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[rgba(0,230,118,0.2)] rounded-full flex items-center justify-center">
              <span className="text-[rgba(0,230,118,1)] font-bold text-lg">C</span>
            </div>
            <span className="text-xl font-semibold text-white">Menu</span>
          </div>
          <div className="space-y-4">
            <Link
              href="/"
              onClick={toggleMenu}
              className="block py-3 px-4 text-lg font-medium text-gray-300 hover:text-[rgba(0,230,118,1)] hover:bg-[rgba(0,230,118,0.1)] rounded-lg transition-all duration-300"
            >
              Home
            </Link>
            {user && (
              <>
                <Link
                  href="/my-account"
                  onClick={toggleMenu}
                  className="block py-3 px-4 text-lg font-medium text-gray-300 hover:text-[rgba(0,230,118,1)] hover:bg-[rgba(0,230,118,0.1)] rounded-lg transition-all duration-300"
                >
                  My Account
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-[rgba(0,0,0,0.7)] z-30 backdrop-blur-sm transition-opacity duration-300"
          onClick={toggleMenu}
        ></div>
      )}
    </>
  );
};