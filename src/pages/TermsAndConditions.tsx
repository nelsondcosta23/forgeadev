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
            content based on public metrics and data. While we aim for accuracy, results may not always 
            be 100% correct. Use this tool as a guide only and verify important information independently.
          </AlertDescription>
        </Alert>
        
        <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Acceptance of Terms</h2>
            <p>
              By accessing or using this application, you agree to these Terms and Conditions. 
              If you do not agree, please discontinue use immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">AI-Generated Content</h2>
            <p>
              Our quiz results and content are created using AI algorithms that process publicly 
              available information. While we strive for accuracy and reliability:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>The content may not be fully accurate or complete</li>
              <li>Results are for informational and educational purposes only</li>
              <li>Do not rely solely on this content for important or financial decisions</li>
              <li>Always verify critical details from independent sources</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Use of Service</h2>
            <p>
              You agree to use this application lawfully and in a way that does not infringe 
              the rights of others or disrupt the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Intellectual Property</h2>
            <p>
              All content, design elements, and functionality of this service are owned by us 
              and protected by applicable copyright and trademark laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, we are not liable for any indirect, 
              incidental, or consequential damages arising from the use—or inability to use—this 
              application, including inaccuracies in AI-generated content.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Accuracy of Information</h2>
            <p>
              All information is provided "as is," without warranties of any kind, express or 
              implied. We do not guarantee that any content is current, accurate, or complete.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Changes to Terms</h2>
            <p>
              We may update these Terms and Conditions at any time. Continued use of the 
              application means you accept the revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Governing Law</h2>
            <p>
              These terms are governed by and construed in accordance with applicable laws, 
              without regard to conflict-of-law principles.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Contact</h2>
            <p>
              If you have questions about these Terms, please contact us through our website.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
