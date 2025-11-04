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
              This Privacy Policy explains how we handle your information when you use our quiz 
              application. We value your privacy and collect only the data necessary to operate 
              and improve the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Information We Collect</h2>
            <p>
              We collect minimal information, specifically:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Country of origin, to generate anonymous usage statistics</li>
            </ul>
            <p className="mt-4">
              We do not collect names, emails, or any personally identifying data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">How We Use This Information</h2>
            <p>
              We use this information solely to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Understand where our users come from (country-level statistics)</li>
              <li>Improve and optimize the quiz experience</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Data Security</h2>
            <p>
              We use standard security measures to protect data and ensure that no personal 
              information is exposed or misused.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Third-Party Services</h2>
            <p>
              We may use third-party tools (e.g., analytics providers) that receive anonymized 
              technical information, such as browser type or device, to help us understand how 
              users interact with the site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Your Rights</h2>
            <p>
              You can contact us if you wish to request information about data handling or deletion. 
              Since we do not store identifiable personal data, there is usually nothing to delete.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy occasionally. Updates will be published on this page.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Contact</h2>
            <p>
              If you have any questions, please reach out through our website.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
