// app/legal/page.tsx
export default function Legal() {
  return (
    <div className="container mx-auto px-6 py-6 text-gray-200">
      <h1 className="text-3xl font-bold mb-6">Legal Notices and Terms of Use</h1>
      <p className="mb-4">
        <strong>Last Updated:</strong> March 10, 2025
      </p>
      <p className="mb-6">
        Welcome to [Your Website Name] (\"Website\"), operated by [Your LLC Name], a limited liability company organized under the laws of [Your State]. This Legal page outlines important information regarding your use of our Website, including our terms of service, disclaimers, privacy practices, and the legal structure under which we operate. By accessing or using this Website, you agree to be bound by these terms and conditions.
      </p>

      {/* Section 1: Purpose and Structure */}
      <h2 className="text-2xl font-semibold mt-6 mb-4">1. Purpose and Structure of [Your LLC Name]</h2>
      <p className="mb-4">
        [Your LLC Name] is a limited liability company (LLC) established to operate this Website, which aggregates and provides social media posts as informational signals (\"Service\"). The LLC structure was chosen for the following reasons:
      </p>
      <ul className="list-disc pl-6 mb-4">
        <li>
          <strong>Limited Liability Protection</strong>: The LLC separates the personal assets of its members from business liabilities, ensuring that personal property is not at risk in the event of business debts or legal claims arising from the operation of the Website.
        </li>
        <li>
          <strong>Professional Credibility</strong>: Operating as an LLC enhances the legitimacy and professionalism of the Website in the eyes of users, partners, and potential investors.
        </li>
        <li>
          <strong>Tax Flexibility</strong>: The LLC structure allows for pass-through taxation, avoiding double taxation, with the option to elect S-Corporation status for additional tax benefits if revenue exceeds certain thresholds.
        </li>
        <li>
          <strong>Operational Efficiency</strong>: An LLC facilitates business banking, growth, and partnerships by providing a formal entity for contracts, subscriptions, and financial transactions.
        </li>
      </ul>
      <p className="mb-4">
        The formation of [Your LLC Name] was completed by filing Articles of Organization with the [Your State] Secretary of State, appointing a registered agent, obtaining an Employer Identification Number (EIN) from the Internal Revenue Service (IRS), and drafting an Operating Agreement to govern internal procedures. This process is straightforward and accessible online in most jurisdictions, typically requiring a filing fee of $50–$500, depending on the state.
      </p>

      {/* Section 2: Terms of Service */}
      <h2 className="text-2xl font-semibold mt-6 mb-4">2. Terms of Service</h2>
      <p className="mb-4">
        <strong>Acceptance of Terms</strong>: By accessing or using the Website, you agree to these Terms of Service (\"Terms\"). If you do not agree, you must discontinue use of the Website immediately.
      </p>
      <p className="mb-4">
        <strong>Use of Service</strong>: The Service provides aggregated social media posts as signals for informational and entertainment purposes only. You may not:
      </p>
      <ul className="list-disc pl-6 mb-4">
        <li>Use the Service for any unlawful purpose or in violation of these Terms.</li>
        <li>Rely on the Service as personalized financial or investment advice (see Disclaimer below).</li>
        <li>Reproduce, distribute, or modify the content without prior written consent from [Your LLC Name].</li>
      </ul>
      <p className="mb-4">
        <strong>Account Termination</strong>: [Your LLC Name] reserves the right to suspend or terminate your access to the Service at its sole discretion, with or without notice, for misuse or violation of these Terms.
      </p>
      <p className="mb-4">
        <strong>Limitation of Liability</strong>: To the fullest extent permitted by law, [Your LLC Name], its members, officers, and affiliates shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from your use of the Website or reliance on the Service, including but not limited to financial losses.
      </p>

      {/* Section 3: Disclaimer */}
      <h2 className="text-2xl font-semibold mt-6 mb-4">3. Disclaimer</h2>
      <p className="mb-4">
        <strong>No Financial Advice</strong>: The signals provided by this Website are derived from aggregated social media posts and are intended for informational and entertainment purposes only. They do not constitute financial advice, investment recommendations, or an offer to buy or sell securities. [Your LLC Name] is not registered as an investment adviser under the Investment Advisers Act of 1940 or any state securities laws. Users are solely responsible for their financial decisions and should consult a qualified financial professional before making investment choices.
      </p>
      <p className="mb-4">
        <strong>Accuracy and Availability</strong>: The information provided through the Service is presented \"as is\" without warranties of accuracy, completeness, or timeliness. [Your LLC Name] does not guarantee the reliability of the aggregated data and is not liable for errors, omissions, or interruptions in service.
      </p>
      <p className="mb-4">
        <strong>No Guarantees</strong>: [Your LLC Name] makes no representations or warranties regarding the profitability, effectiveness, or suitability of the signals for any purpose. Past performance, if referenced, is not indicative of future results.
      </p>

      {/* Section 4: Intellectual Property */}
      <h2 className="text-2xl font-semibold mt-6 mb-4">4. Intellectual Property</h2>
      <p className="mb-4">
        <strong>Ownership</strong>: All content on the Website, including aggregated signals, text, graphics, and code, is the property of [Your LLC Name] or its licensors and is protected by U.S. copyright and intellectual property laws.
      </p>
      <p className="mb-4">
        <strong>Social Media Content</strong>: The Service aggregates publicly available social media posts. To mitigate copyright risks:
      </p>
      <ul className="list-disc pl-6 mb-4">
        <li>Posts are summarized or transformed rather than reproduced verbatim, where feasible.</li>
        <li>Use of such content complies with applicable platform terms of service and public APIs, with attribution provided as required.</li>
        <li>Users may not copy, distribute, or create derivative works from the aggregated signals without express permission.</li>
      </ul>
      <p className="mb-4">
        <strong>Infringement Claims</strong>: If you believe your copyrighted material has been used improperly, please contact us at [Your Contact Email] with details for review under the Digital Millennium Copyright Act (DMCA).
      </p>

      {/* Section 5: Privacy Policy */}
      <h2 className="text-2xl font-semibold mt-6 mb-4">5. Privacy Policy</h2>
      <p className="mb-4">
        <strong>Data Collection</strong>: [Your LLC Name] may collect certain information from users, such as email addresses, subscription details, and usage data, to provide and improve the Service. We do not store or process personally identifiable information (PII) from social media posts beyond what is necessary for aggregation.
      </p>
      <p className="mb-4">
        <strong>Compliance</strong>: We comply with applicable privacy laws, including the California Consumer Privacy Act (CCPA) and, where relevant, the General Data Protection Regulation (GDPR). Our practices include:
      </p>
      <ul className="list-disc pl-6 mb-4">
        <li>Providing a clear explanation of data collection in this Privacy Policy.</li>
        <li>Offering users the ability to opt out of data collection via [Your Contact Email].</li>
        <li>Implementing reasonable security measures to protect user data.</li>
      </ul>
      <p className="mb-4">
        <strong>Third Parties</strong>: We may use third-party services (e.g., Stripe for payments) that have their own privacy policies. Users are encouraged to review those policies.
      </p>
      <p className="mb-4">
        <strong>Contact</strong>: For privacy-related inquiries or to exercise your rights (e.g., data deletion), contact us at [Your Contact Email].
      </p>

      {/* Section 6: Subscription and Billing */}
      <h2 className="text-2xl font-semibold mt-6 mb-4">6. Subscription and Billing</h2>
      <p className="mb-4">
        <strong>Service Plans</strong>: The Website offers subscription tiers (e.g., Free and Premium) as described on the pricing page. Subscription fees are processed via Stripe, and users are responsible for reviewing billing terms at checkout.
      </p>
      <p className="mb-4">
        <strong>Cancellation</strong>: Premium subscribers may cancel at any time via the billing portal, with access continuing until the end of the current billing period. No refunds are provided for partial periods.
      </p>
      <p className="mb-4">
        <strong>Consumer Protection</strong>: [Your LLC Name] adheres to fair billing practices, avoids misleading claims, and ensures transparency in subscription terms. Questions or disputes should be directed to [Your Contact Email].
      </p>

      {/* Section 7: Governing Law and Dispute Resolution */}
      <h2 className="text-2xl font-semibold mt-6 mb-4">7. Governing Law and Dispute Resolution</h2>
      <p className="mb-4">
        <strong>Jurisdiction</strong>: These Terms are governed by the laws of [Your State], without regard to conflict of law principles. Any legal action arising from the use of the Website shall be filed in the state or federal courts of [Your County/State].
      </p>
      <p className="mb-4">
        <strong>Dispute Resolution</strong>: In the event of a dispute, parties agree to attempt informal resolution via email communication before pursuing legal action. If unresolved, disputes may proceed to binding arbitration under the rules of the American Arbitration Association, at the discretion of [Your LLC Name].
      </p>

      {/* Section 8: Contact Information */}
      <h2 className="text-2xl font-semibold mt-6 mb-4">8. Contact Information</h2>
      <p className="mb-4">
        For questions, concerns, or legal notices, please contact:
      </p>
      <p className="mb-2">[Your LLC Name]</p>
      <p className="mb-2">[Your Mailing Address, if applicable]</p>
      <p className="mb-4">Email: [Your Contact Email]</p>
    </div>
  );
}