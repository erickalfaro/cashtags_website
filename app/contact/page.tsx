// app/contact/page.tsx
export default function ContactPage() {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-200 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[var(--container-bg)] border border-[var(--border-color)] rounded-lg p-8 shadow-lg">
          <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
          <p className="mb-6 text-gray-400">
            Have questions or need help? Drop us a line and we’ll get back to you ASAP.
          </p>
          <form action="mailto:support@cashtags.ai" method="POST" className="space-y-4">
            <input type="text" name="Name" placeholder="Your name" required className="w-full p-2 rounded border border-[var(--border-color)] bg-[var(--container-bg)]"/>
            <input type="email" name="Email" placeholder="Your email" required className="w-full p-2 rounded border border-[var(--border-color)] bg-[var(--container-bg)]"/>
            <textarea name="Message" rows={5} placeholder="Your message" required className="w-full p-2 rounded border border-[var(--border-color)] bg-[var(--container-bg)]"/>
            <button type="submit" className="w-full py-2 bg-green-600 hover:bg-green-700 rounded text-white font-medium">
              Send Message
            </button>
          </form>
        </div>
      </div>
    );
  }
  