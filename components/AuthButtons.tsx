// components/AuthButtons.tsx
"use client";

import { supabase } from "../lib/supabase";

export const AuthButtons: React.FC = () => {
  const getBaseUrl = () => {
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  };

  const signInWithGoogle = async () => {
    const baseUrl = getBaseUrl();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${baseUrl}/api/auth/callback`,
      },
    });
    if (error) console.error("Error signing in with Google:", error);
  };

  const signInWithTwitter = async () => {
    const baseUrl = getBaseUrl();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "twitter",
      options: {
        redirectTo: `${baseUrl}/api/auth/callback?next=/`,
      },
    });
    if (error) console.error("Error signing in with Twitter:", error);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <button
        onClick={signInWithGoogle}
        className="flex items-center justify-center gap-2 px-6 py-3 bg-[rgba(0,230,118,0.9)] text-white text-lg font-semibold rounded-lg hover:bg-[rgba(0,255,130,1)] hover:shadow-[0_0_15px_rgba(0,230,118,0.3)] transition-all duration-300"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.545 10.52v3.135h5.208c-.21 1.35-.81 2.49-1.785 3.315v2.745h2.895c1.695-1.56 2.67-3.855 2.67-6.6 0-.63-.06-1.245-.165-1.83h-8.82z" fill="#4285F4"/>
          <path d="M12 21.75c2.97 0 5.49-1.005 7.32-2.715l-2.895-2.745c-.825.555-1.875.885-3.425.885-2.64 0-4.875-1.785-5.67-4.185H4.35v2.625C6.165 19.125 8.97 21.75 12 21.75z" fill="#34A853"/>
          <path d="M6.33 13.485c-.195-.63-.33-1.29-.33-1.98s.135-1.35.33-1.98V6.885H4.35C3.75 8.235 3.375 9.75 3.375 11.505c0 1.755.375 3.27 1.005 4.62l1.95-1.62z" fill="#FBBC05"/>
          <path d="M12 5.805c1.515 0 2.865.525 3.93 1.545l2.925-2.925C17.01 2.685 14.49 1.755 12 1.755c-3.03 0-5.835 2.625-7.65 6.12l1.95 1.62c.795-2.4 3.03-4.185 5.67-4.185z" fill="#EA4335"/>
        </svg>
        Join with Google
      </button>
      <button
        onClick={signInWithTwitter}
        className="flex items-center justify-center gap-2 px-6 py-3 bg-[#1DA1F2] text-white text-lg font-semibold rounded-lg hover:bg-[#1A91DA] hover:shadow-[0_0_15px_rgba(29,161,242,0.3)] transition-all duration-300"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.643 4.937c-.835.37-1.732.62-2.675.733a4.67 4.67 0 002.048-2.578 9.3 9.3 0 01-2.958 1.13 4.66 4.66 0 00-7.938 4.25 13.229 13.229 0 01-9.602-4.868c-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878a4.675 4.675 0 01-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568a4.688 4.688 0 01-2.103.08c.592 1.847 2.31 3.192 4.343 3.23a9.361 9.361 0 01-5.81 2.003c-.377 0-.75-.022-1.118-.065a13.206 13.206 0 007.153 2.093c8.59 0 13.287-7.113 13.287-13.287 0-.203-.005-.405-.014-.606a9.5 9.5 0 002.328-2.417z"/>
        </svg>
        Join with Twitter
      </button>
    </div>
  );
};