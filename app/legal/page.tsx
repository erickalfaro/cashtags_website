// app/legal/page.tsx
export default function Legal() {
    return (
      <div className="p-6 max-w-4xl mx-auto bg-gray-900 text-gray-200 min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Legal Information</h1>
        <section className="mb-6">
          <h2 className="text-xl font-semibold">Disclaimer</h2>
          <p>The information provided on this site is for informational purposes only and does not constitute financial advice.</p>
        </section>
        <section className="mb-6">
          <h2 className="text-xl font-semibold">Privacy Policy</h2>
          <p>We collect minimal user data for authentication and subscription purposes. Your data is protected and not shared with third parties except as required for payment processing.</p>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Terms of Service</h2>
          <p>By using this site, you agree to our terms of service, which include responsible use and compliance with applicable laws.</p>
        </section>
      </div>
    );
  }