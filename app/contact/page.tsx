// app/contact/page.tsx
"use client";

import { useState } from "react";

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");

    // Simulate form submission (since this uses mailto:)
    setTimeout(() => {
      const mailtoLink = `mailto:support@cashtags.ai?subject=Contact%20Form%20Submission&body=Name:%20${encodeURIComponent(
        formData.name
      )}%0AEmail:%20${encodeURIComponent(formData.email)}%0AMessage:%20${encodeURIComponent(formData.message)}`;
      window.location.href = mailtoLink;
      setStatus("sent");
      setFormData({ name: "", email: "", message: "" });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0D1117] to-[#1A1F2A] text-gray-300 pt-20 px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-[#161B22] p-6 rounded-lg border border-[rgba(48,54,61,0.5)] shadow-md">
          <h1 className="text-2xl font-bold text-white">Contact Us</h1>
          <p className="text-sm text-gray-400 mt-1">
            Reach out to our team for support or inquiries about your Cashtags experience.
          </p>
          <div className="hidden md:block absolute top-0 right-0 w-24 h-24 bg-[rgba(0,230,118,0.1)] rounded-full blur-2xl transform translate-x-1/3 -translate-y-1/3"></div>
        </div>

        {/* Form Section */}
        <div className="bg-[#161B22] p-6 rounded-lg border border-[rgba(48,54,61,0.5)] shadow-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm text-gray-400">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full p-3 bg-[#1A1F2A] border border-[rgba(48,54,61,0.5)] rounded-lg text-white focus:outline-none focus:border-[rgba(0,230,118,0.7)] transition-colors duration-300"
                placeholder="Your Name"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm text-gray-400">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full p-3 bg-[#1A1F2A] border border-[rgba(48,54,61,0.5)] rounded-lg text-white focus:outline-none focus:border-[rgba(0,230,118,0.7)] transition-colors duration-300"
                placeholder="Your Email"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="message" className="text-sm text-gray-400">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                required
                rows={6}
                className="w-full p-3 bg-[#1A1F2A] border border-[rgba(48,54,61,0.5)] rounded-lg text-white focus:outline-none focus:border-[rgba(0,230,118,0.7)] transition-colors duration-300 resize-none"
                placeholder="How can we assist you?"
              />
            </div>
            <button
              type="submit"
              disabled={status === "sending" || status === "sent"}
              className={`w-full py-3 rounded-lg font-semibold text-white transition-all duration-300 ${
                status === "sending"
                  ? "bg-gray-600 cursor-not-allowed"
                  : status === "sent"
                  ? "bg-[rgba(0,230,118,0.7)] cursor-default"
                  : "bg-[rgba(0,230,118,0.9)] hover:bg-[rgba(0,255,130,1)] hover:shadow-[0_0_15px_rgba(0,230,118,0.3)]"
              }`}
            >
              {status === "sending" ? "Sending..." : status === "sent" ? "Message Sent" : "Send Message"}
            </button>
          </form>
          {status === "sent" && (
            <p className="mt-4 text-[rgba(0,230,118,1)] text-sm text-center">
              Your message has been sent. We’ll get back to you soon!
            </p>
          )}
          {status === "error" && (
            <p className="mt-4 text-[rgba(255,85,85,1)] text-sm text-center">
              An error occurred. Please try again or email us directly at support@cashtags.ai.
            </p>
          )}
        </div>

        {/* Alternative Contact */}
        <div className="bg-[#161B22] p-6 rounded-lg border border-[rgba(48,54,61,0.5)] shadow-md text-center">
          <p className="text-gray-400 text-sm">
            Prefer email? Reach us directly at{" "}
            <a href="mailto:support@cashtags.ai" className="text-[rgba(0,230,118,1)] hover:underline">
              support@cashtags.ai
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}