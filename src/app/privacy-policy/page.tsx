import Header from '@/components/header';
import Footer from '@/components/footer';
import CartDrawer from '@/components/cart-drawer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-muted/20 min-h-screen">
      <Header />
      <main className="container py-12">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Privacy Policy</CardTitle>
              <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
            </CardHeader>
            <CardContent className="space-y-6 text-muted-foreground leading-relaxed">
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-2">1. Introduction</h2>
                <p>
                  Welcome to Pickbazar. We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-2">2. Information We Collect</h2>
                <p>
                  We may collect personal identification information (Name, email address, phone number, etc.) and non-personal identification information (browser name, type of computer, etc.).
                </p>
              </section>
               <section>
                <h2 className="text-xl font-semibold text-foreground mb-2">3. How We Use Your Information</h2>
                <p>
                  We may use the information we collect from you to personalize your experience, to improve our website, to process transactions, and to send periodic emails.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-2">4. How We Protect Your Information</h2>
                <p>
                  We adopt appropriate data collection, storage and processing practices and security measures to protect against unauthorized access, alteration, disclosure or destruction of your personal information.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-2">5. Sharing Your Personal Information</h2>
                <p>
                  We do not sell, trade, or rent users personal identification information to others. We may share generic aggregated demographic information not linked to any personal identification information regarding visitors and users with our business partners, trusted affiliates and advertisers.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-2">6. Changes to This Privacy Policy</h2>
                <p>
                  Pickbazar has the discretion to update this privacy policy at any time. When we do, we will revise the updated date at the top of this page. We encourage Users to frequently check this page for any changes to stay informed about how we are helping to protect the personal information we collect.
                </p>
              </section>
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-2">7. Your Acceptance of These Terms</h2>
                <p>
                  By using this Site, you signify your acceptance of this policy. If you do not agree to this policy, please do not use our Site. Your continued use of the Site following the posting of changes to this policy will be deemed your acceptance of those changes.
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
