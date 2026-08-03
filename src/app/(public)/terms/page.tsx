export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <h1 className="text-4xl font-bold tracking-tight mb-8">Terms of Service</h1>
      
      <div className="prose dark:prose-invert max-w-none space-y-8">
        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing and using EventHub ("the Platform"), you accept and agree to be bound by the terms and provision of this agreement. In addition, when using this Platform's particular services, you shall be subject to any posted guidelines or rules applicable to such services.</p>
        </section>

        <section>
          <h2>2. User Registration and Accounts</h2>
          <p>To use certain features of the Platform, you must register for an account. You agree to:</p>
          <ul>
            <li>Provide accurate, current, and complete information.</li>
            <li>Maintain the security of your password and identification.</li>
            <li>Accept all responsibility for any and all activities that occur under your account.</li>
          </ul>
        </section>

        <section>
          <h2>3. Event Registration and Attendance</h2>
          <p>When registering for events through the Platform:</p>
          <ul>
            <li>Registrations are subject to approval by event organizers.</li>
            <li>You agree to abide by the rules and code of conduct set by event organizers.</li>
            <li>QR codes generated for attendance must not be shared or duplicated.</li>
          </ul>
        </section>

        <section>
          <h2>4. Volunteer Responsibilities</h2>
          <p>Users approved as volunteers agree to:</p>
          <ul>
            <li>Fulfill assigned tasks to the best of their ability.</li>
            <li>Maintain professional conduct during events.</li>
            <li>Use the scanning and management tools responsibly and solely for their intended purposes.</li>
          </ul>
        </section>

        <section>
          <h2>5. Modifications to Service</h2>
          <p>We reserve the right at any time to modify or discontinue, temporarily or permanently, the Service (or any part thereof) with or without notice.</p>
        </section>
      </div>
    </div>
  );
}
