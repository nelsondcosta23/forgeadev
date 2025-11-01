import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <Link to="/" className="text-primary hover:underline mb-8 inline-block">
          ← Back to Home
        </Link>
        
        <h1 className="text-4xl font-bold mb-8 text-foreground">Privacy Policy</h1>
        
        <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Introduction</h2>
            <p>
              This Privacy Policy describes how we collect, use, and protect your personal information 
              when you use our quiz application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Information We Collect</h2>
            <p>
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Quiz responses and results</li>
              <li>Usage data and analytics</li>
              <li>Device and browser information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">How We Use Your Information</h2>
            <p>
              We use the collected information to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide and improve our services</li>
              <li>Analyze usage patterns and trends</li>
              <li>Personalize your experience</li>
              <li>Communicate with you about our services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Data Security</h2>
            <p>
              We implement appropriate security measures to protect your personal information from 
              unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Third-Party Services</h2>
            <p>
              We may use third-party services for analytics and other purposes. These services may 
              collect information sent by your browser as part of a web page request.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Your Rights</h2>
            <p>
              You have the right to access, correct, or delete your personal information. Please 
              contact us if you wish to exercise these rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes 
              by posting the new Privacy Policy on this page.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us through our 
              website.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
