import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <Link to="/" className="text-primary hover:underline mb-8 inline-block">
          ← Back to Home
        </Link>
        
        <h1 className="text-4xl font-bold mb-8 text-foreground">Terms and Conditions</h1>
        
        <Alert className="mb-8 border-amber-500 bg-amber-500/10">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          <AlertDescription className="text-foreground">
            <strong>Important Notice:</strong> This application uses artificial intelligence to generate 
            content based on public metrics and data. While we strive for accuracy, the information 
            provided may not always be 100% correct. Please use this tool as a guide and verify 
            critical information independently.
          </AlertDescription>
        </Alert>
        
        <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Acceptance of Terms</h2>
            <p>
              By accessing and using this quiz application, you accept and agree to be bound by the 
              terms and provisions of this agreement. If you do not agree to these terms, please do 
              not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">AI-Generated Content Disclaimer</h2>
            <p>
              Our quiz content and results are generated using artificial intelligence algorithms 
              based on publicly available metrics and data sources. While we make every effort to 
              ensure accuracy and reliability:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>The content may not always be 100% accurate or complete</li>
              <li>Results should be considered as informational and educational</li>
              <li>You should not rely solely on this information for critical decisions</li>
              <li>We recommend verifying important information through additional sources</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Use of Service</h2>
            <p>
              You agree to use this service only for lawful purposes and in a way that does not 
              infringe the rights of others or restrict their use and enjoyment of the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Intellectual Property</h2>
            <p>
              All content, features, and functionality of this service are owned by us and are 
              protected by international copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, we shall not be liable for any indirect, 
              incidental, special, consequential, or punitive damages resulting from your use of 
              or inability to use the service, including any inaccuracies in AI-generated content.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Accuracy of Information</h2>
            <p>
              We do not warrant that the information provided through our AI systems is accurate, 
              complete, or current. The quiz results and content are provided "as is" without any 
              warranties, express or implied.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Continued use of the service 
              after changes constitutes acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Governing Law</h2>
            <p>
              These terms shall be governed by and construed in accordance with applicable laws, 
              without regard to conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Contact Information</h2>
            <p>
              If you have any questions about these Terms and Conditions, please contact us through 
              our website.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
