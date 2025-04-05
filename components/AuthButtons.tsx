// components/AuthButtons.tsx
"use client";

import { supabase } from "../lib/supabase";

export const AuthButtons: React.FC = () => {
  const getBaseUrl = () => {
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const host = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_BASE_URL || "localhost:3000";
    return `${protocol}://${host.replace(/^https?:\/\//, '')}`;
  };

  const signInWithGoogle = async () => {
    const baseUrl = getBaseUrl();
    const redirectTo = `${baseUrl}/api/auth/callback`;
    console.log("Google Sign In Redirect URL:", redirectTo);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectTo,
      },
    });
    if (error) console.error("Error signing in with Google:", error);
  };

  return (
    <div className="flex justify-center">
      {/* Button Style: Increase padding (px-6 py-2.5) and font size (text-lg) */}
      <button
        onClick={signInWithGoogle}
        className="flex items-center justify-center gap-2 px-10 py-5 bg-transparent border border-[rgba(0,230,118,0.8)] text-[rgba(0,230,118,1)] text-lg font-medium rounded-full hover:bg-[rgba(0,230,118,0.1)] transition-colors duration-200" // Changed px-5->px-6, py-2->py-2.5, text-base->text-lg
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"> {/* Icon size kept same for now */}
           <path d="M12.545 10.52v3.135h5.208c-.21 1.35-.81 2.49-1.785 3.315v2.745h2.895c1.695-1.56 2.67-3.855 2.67-6.6 0-.63-.06-1.245-.165-1.83h-8.82z" fill="#4285F4"/>
           <path d="M12 21.75c2.97 0 5.49-1.005 7.32-2.715l-2.895-2.745c-.825.555-1.875.885-3.425.885-2.64 0-4.875-1.785-5.67-4.185H4.35v2.625C6.165 19.125 8.97 21.75 12 21.75z" fill="#34A853"/>
           <path d="M6.33 13.485c-.195-.63-.33-1.29-.33-1.98s.135-1.35.33-1.98V6.885H4.35C3.75 8.235 3.375 9.75 3.375 11.505c0 1.755.375 3.27 1.005 4.62l1.95-1.62z" fill="#FBBC05"/>
           <path d="M12 5.805c1.515 0 2.865.525 3.93 1.545l2.925-2.925C17.01 2.685 14.49 1.755 12 1.755c-3.03 0-5.835 2.625-7.65 6.12l1.95 1.62c.795-2.4 3.03-4.185 5.67-4.185z" fill="#EA4335"/>
        </svg>
        Sign In with Google
      </button>
    </div>
  );
};