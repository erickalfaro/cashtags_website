// app/legal/page.tsx
"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

export default function LegalPage() {
  const [privacyContent, setPrivacyContent] = useState<string>("");
  const [termsContent, setTermsContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch Privacy Policy
        const privacyResponse = await fetch("/content/legal/privacy.md");
        if (!privacyResponse.ok) {
          throw new Error("Failed to fetch Privacy Policy");
        }
        const privacyText = await privacyResponse.text();
        setPrivacyContent(privacyText);

        // Fetch Terms and Conditions
        const termsResponse = await fetch("/content/legal/terms.md");
        if (!termsResponse.ok) {
          throw new Error("Failed to fetch Terms and Conditions");
        }
        const termsText = await termsResponse.text();
        setTermsContent(termsText);
      } catch (err) {
        console.error("Error fetching legal content:", err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-200">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-200">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 text-gray-200">
      <h1 className="text-3xl font-bold mb-6">Legal</h1>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Privacy Policy</h2>
        <div className="prose prose-invert max-w-none">
          <ReactMarkdown>{privacyContent}</ReactMarkdown>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Terms and Conditions</h2>
        <div className="prose prose-invert max-w-none">
          <ReactMarkdown>{termsContent}</ReactMarkdown>
        </div>
      </section>
    </div>
  );
}